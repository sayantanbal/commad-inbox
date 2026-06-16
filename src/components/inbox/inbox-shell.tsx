"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDays, addMinutes, differenceInMinutes, format } from "date-fns";
import { Activity, Command, Keyboard, Search, Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useHotkeys } from "react-hotkeys-hook";
import { Group, Panel, useDefaultLayout } from "react-resizable-panels";
import { ActivityBar } from "@/components/inbox/activity-bar";
import { AgentChatPanel } from "@/components/inbox/agent-chat-panel";
import { AgentWelcome } from "@/components/inbox/agent-welcome";
import { AddContactModal } from "@/components/inbox/add-contact-modal";
import { CustomSchedulePicker } from "@/components/inbox/custom-schedule-picker";
import { CalendarPanel } from "@/components/inbox/calendar-panel";
import { DefragPanel } from "@/components/inbox/defrag-panel";
import { CommitmentsPanel } from "@/components/inbox/commitments-panel";
import { ExportTaskModal } from "@/components/inbox/export-task-modal";
import { InboxSettingsPanel } from "@/components/inbox/inbox-settings-panel";
import { MeetingPreBriefPanel } from "@/components/inbox/meeting-pre-brief-panel";
import { DailyBriefPanel } from "@/components/inbox/daily-brief-panel";
import { MailboxEmptyState } from "@/components/inbox/mailbox-empty-state";
import { PrimaryNav, type MailboxView, type WorkspacePanel } from "@/components/inbox/primary-nav";
import { CommandPalette } from "@/components/inbox/command-palette";
import { ComposerPanel } from "@/components/inbox/composer-panel";
import { ShortcutCheatsheet } from "@/components/inbox/shortcut-cheatsheet";
import { MobileCommandFab, MobileTabBar, type MobileTab } from "@/components/inbox/mobile-tab-bar";
import { ScheduleOverlapModal } from "@/components/inbox/schedule-overlap-modal";
import { RescheduleExistingMeetingModal } from "@/components/inbox/reschedule-existing-meeting-modal";
import { SendLaterPicker } from "@/components/inbox/send-later-picker";
import { SnoozePicker } from "@/components/inbox/snooze-picker";
import { ThreadList } from "@/components/inbox/thread-list";
import { ThreadView } from "@/components/inbox/thread-view";
import { UndoToast, type UndoState } from "@/components/inbox/undo-toast";
import { Button } from "@/components/ui/button";
import { KbdBadge } from "@/components/ui/kbd-badge";
import { Input } from "@/components/ui/input";
import { ResizeHandle } from "@/components/ui/resize-handle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ActivityItem } from "@/lib/activity";
import {
  computeFreeSlots,
  findConflictingEvent,
  findNearestFreeSlot,
  isSlotBusy,
  type BusyInterval,
} from "@/lib/calendar/free-slots";
import {
  archiveThreadApi,
  cancelMeetingApi,
  cancelSendApi,
  createFocusBlockApi,
  createMeetingApi,
  addContactApi,
  dismissContactApi,
  fetchFreeBusyApi,
  deleteFocusBlockApi,
  dispatchSendApi,
  fetchCalendarEventsApi,
  generateDraftApi,
  queueSendApi,
  restoreThreadApi,
  snoozeThreadApi,
  unsnoozeThreadApi,
  updateMeetingApi,
  connectLinearApi,
  confirmCommitmentApi,
  exportTaskApi,
  fetchCommitmentsApi,
  fetchInboxSyncApi,
  fetchMailboxThreadsApi,
  fetchPreBriefApi,
  fetchPreferencesApi,
  fetchSendTimeSuggestionApi,
  fetchSnippetsApi,
  patchCommitmentApi,
  patchPreferencesApi,
  rescheduleCalendarEventApi,
  type CommitmentItem,
} from "@/lib/inbox/client-api";
import { DEFAULT_WORKING_DAYS } from "@/lib/preferences/sanitize-working-days";
import { replyRecipients, resolveMeetingAttendees } from "@/lib/inbox/recipients";
import { summarizeRsvp } from "@/lib/inbox/rsvp";
import { SearchOverlay } from "@/components/inbox/search-overlay";
import { AdvancedSearchOverlay } from "@/components/inbox/advanced-search-overlay";
import { useInboxRealtime } from "@/hooks/use-inbox-realtime";
import {
  useContacts,
  useInboxPreferences,
  useSendTimeSuggestion,
  useSnippets,
} from "@/hooks/use-inbox-queries";
import { inboxQueryKeys } from "@/lib/inbox/query-keys";
import { useInboxShortcuts } from "@/hooks/use-inbox-shortcuts";
import { useAiProvider } from "@/hooks/use-ai-provider";
import { useIsMobile, usePlatform } from "@/hooks/use-platform";
import type { MeetingBriefStored, SendTimeSuggestion, SuggestedAction } from "@/lib/schemas/domain";
import { mergeClassifications } from "@/lib/inbox/merge-classifications";
import { schedulingIntentFromAgentInvite, shouldBridgeInviteToInbox } from "@/lib/inbox/agent-scheduling-intent";
import { deserializeInboxData, deserializeThreads } from "@/lib/inbox-serialize";
import type { InboxRealtimeEvent } from "@/lib/realtime/pusher";
import { formatFullIndexBannerDetail } from "@/lib/backfill/inbox-index-format";
import type { InboxIndexStatus } from "@/lib/backfill/inbox-index-format";
import type { CalendarEvent, Classification, SchedulingIntent, Thread, ThreadMeeting, TriageLane } from "@/lib/types";

const ACTIVE_LANES: TriageLane[] = ["reply", "schedule", "fyi"];
const LAYOUT_ID = "command-inbox-v3";
const LAYOUT_STORAGE_KEY = `react-resizable-panels:${LAYOUT_ID}:list:main:sidebar`;
const DEFAULT_LAYOUT = { list: 22, main: 38, sidebar: 40 };



const laneLabels: Record<TriageLane, string> = {
  reply: "Reply",
  schedule: "Schedule",
  fyi: "FYI",
  done: "Done",
};

interface SnoozedThread {
  threadId: string;
  until: Date;
  label: string;
}

interface InboxShellProps {
  threads: Thread[];
  classifications: Classification[];
  events: CalendarEvent[];
  threadMeetings: ThreadMeeting[];
  userId: string;
  userEmail: string;
  backfillComplete: boolean;
  indexStatus: InboxIndexStatus;
  initialSnoozes: Array<{ threadId: string; until: Date }>;
  initialOpenSettings?: string | null;
  googleContactsReturn?: string | null;
}

function initialLane(classifications: Classification[]): TriageLane {
  for (const lane of ACTIVE_LANES) {
    if (classifications.some((item) => item.lane === lane)) {
      return lane;
    }
  }
  return "reply";
}

function initialThreadId(threads: Thread[], classifications: Classification[], lane: TriageLane) {
  const match = threads.find((thread) => classifications.find((c) => c.threadId === thread.id)?.lane === lane);
  return match?.id ?? threads[0]?.id ?? null;
}

export function InboxShell({
  threads: initialThreads,
  classifications: initialClassifications,
  events: initialEvents,
  threadMeetings: initialThreadMeetings,
  userId,
  userEmail,
  backfillComplete,
  indexStatus: initialIndexStatus,
  initialSnoozes,
  initialOpenSettings,
  googleContactsReturn,
}: InboxShellProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isMac, modLabel } = usePlatform();
  const isMobile = useIsMobile();
  const startingLane = initialLane(initialClassifications);

  const { defaultLayout: savedLayout, onLayoutChanged } = useDefaultLayout({
    id: LAYOUT_ID,
    panelIds: ["list", "main", "sidebar"],
  });

  const { data: prefsData } = useInboxPreferences();
  const { data: snippetsData } = useSnippets();
  const { data: contactsData } = useContacts();

  const [liveThreads, setLiveThreads] = useState(initialThreads);
  const [classifications, setClassifications] = useState(initialClassifications);
  const [calendarEvents, setCalendarEvents] = useState(initialEvents);
  const [threadMeetings, setThreadMeetings] = useState(initialThreadMeetings);
  const [snoozed, setSnoozed] = useState<SnoozedThread[]>(() =>
    initialSnoozes.map((snooze) => ({
      threadId: snooze.threadId,
      until: snooze.until,
      label: format(snooze.until, "EEE h:mm a"),
    }))
  );
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activeLane, setActiveLane] = useState<TriageLane>(startingLane);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(() =>
    initialThreadId(initialThreads, initialClassifications, startingLane)
  );
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [threadSearch, setThreadSearch] = useState("");
  const [calendarSearch, setCalendarSearch] = useState("");
  const [activityOpen, setActivityOpen] = useState(false);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerDraft, setComposerDraft] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [availabilityMode, setAvailabilityMode] = useState<"create" | "reschedule">("create");
  const [sendLaterOpen, setSendLaterOpen] = useState(false);
  const [sendLaterBody, setSendLaterBody] = useState("");
  const [sendLaterAttachmentIds, setSendLaterAttachmentIds] = useState<string[]>([]);
  const [meetingDurationMinutes, setMeetingDurationMinutes] = useState<30 | 45 | 60>(30);
  const [overlapModalOpen, setOverlapModalOpen] = useState(false);
  const [overlapConflict, setOverlapConflict] = useState<CalendarEvent | null>(null);
  const [overlapProposedStart, setOverlapProposedStart] = useState<Date | null>(null);
  const [pendingContactEmail, setPendingContactEmail] = useState<string | null>(null);
  const [customScheduleOpen, setCustomScheduleOpen] = useState(false);
  const [pendingCustomSlot, setPendingCustomSlot] = useState<Date | null>(null);
  const [rescheduleConflictEvent, setRescheduleConflictEvent] = useState<CalendarEvent | null>(null);
  const [rescheduleConfirmOpen, setRescheduleConfirmOpen] = useState(false);
  const [agentSchedulingIntent, setAgentSchedulingIntent] = useState<SchedulingIntent | null>(null);
  const [attendeeBusy, setAttendeeBusy] = useState<BusyInterval[]>([]);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("agent");
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [workspacePanel, setWorkspacePanel] = useState<WorkspacePanel>("welcome");
  const [mailboxView, setMailboxView] = useState<MailboxView>("inbox");
  const [sentThreads, setSentThreads] = useState<Thread[]>([]);
  const [mailboxLoading, setMailboxLoading] = useState(false);
  const [defragOpen, setDefragOpen] = useState(false);
  const [briefInvalidationKey, setBriefInvalidationKey] = useState(0);
  const [commitmentsOpen, setCommitmentsOpen] = useState(false);
  const [commitmentsView, setCommitmentsView] = useState<"commitments" | "waiting">("waiting");
  const [commitmentsLoading, setCommitmentsLoading] = useState(false);
  const [commitmentItems, setCommitmentItems] = useState<CommitmentItem[]>([]);
  const [threadCommitments, setThreadCommitments] = useState<CommitmentItem[]>([]);
  const [preBriefOpen, setPreBriefOpen] = useState(false);
  const [preBriefLoading, setPreBriefLoading] = useState(false);
  const [preBrief, setPreBrief] = useState<MeetingBriefStored | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(initialOpenSettings === "contacts");

  useEffect(() => {
    if (initialOpenSettings === "contacts") {
      setSettingsOpen(true);
    }
  }, [initialOpenSettings]);

  const prefs = prefsData ?? {
    batchWindows: ["09:00", "13:00", "17:00"],
    focusModeEnabled: true,
    autoResponderTemplate: "",
    followUpDaysDefault: 5,
    timezone: "UTC",
    workingDaysStructured: DEFAULT_WORKING_DAYS,
  };
  const workingDaysStructured = prefs.workingDaysStructured ?? DEFAULT_WORKING_DAYS;
  const snippets = snippetsData ?? [];
  const agentContacts = useMemo(
    () =>
      (contactsData ?? []).map((c) => ({
        email: c.email,
        displayName: c.displayName ?? c.email.split("@")[0] ?? c.email,
      })),
    [contactsData]
  );

  const knownContactEmails = useMemo(
    () => new Set((contactsData ?? []).map((contact) => contact.email.toLowerCase())),
    [contactsData]
  );

  const promptUnknownContacts = useCallback(
    (emails: string[]) => {
      for (const email of emails) {
        const normalized = email.trim().toLowerCase();
        if (!normalized.includes("@")) continue;
        if (normalized === userEmail.toLowerCase()) continue;
        if (knownContactEmails.has(normalized)) continue;
        setPendingContactEmail(normalized);
        return;
      }
    },
    [knownContactEmails, userEmail]
  );

  const threadMeetingEventIds = useMemo(
    () => new Set(threadMeetings.map((m) => m.eventId)),
    [threadMeetings]
  );
  const [linearToken, setLinearToken] = useState("");
  const [linearTeamId, setLinearTeamId] = useState("");
  const [undo, setUndo] = useState<UndoState | null>(null);
  const { provider, aiKeysStatus, setAiKeysStatus, refreshAiKeysStatus } = useAiProvider();

  const snoozedIds = useMemo(() => new Set(snoozed.map((s) => s.threadId)), [snoozed]);

  const classificationMap = useMemo(
    () => new Map(classifications.map((c) => [c.threadId, c])),
    [classifications]
  );

  const laneThreads = useMemo(
    () =>
      liveThreads.filter((t) => {
        if (snoozedIds.has(t.id)) return false;
        return classificationMap.get(t.id)?.lane === activeLane;
      }),
    [liveThreads, classificationMap, activeLane, snoozedIds]
  );

  const filteredLaneThreads = useMemo(() => {
    const q = threadSearch.trim().toLowerCase();
    if (!q) return laneThreads;
    return laneThreads.filter((t) => {
      const c = classificationMap.get(t.id);
      return (
        t.subject.toLowerCase().includes(q) ||
        t.snippet.toLowerCase().includes(q) ||
        (c?.sender ?? "").toLowerCase().includes(q)
      );
    });
  }, [laneThreads, threadSearch, classificationMap]);

  const listThreads = useMemo(() => {
    if (mailboxView === "sent") return sentThreads;
    if (mailboxView === "snoozed") {
      return liveThreads.filter((t) => snoozedIds.has(t.id));
    }
    if (mailboxView === "archive") {
      return liveThreads.filter((t) => classificationMap.get(t.id)?.lane === "done");
    }
    return filteredLaneThreads;
  }, [
    mailboxView,
    sentThreads,
    liveThreads,
    snoozedIds,
    classificationMap,
    filteredLaneThreads,
  ]);

  const filteredListThreads = useMemo(() => {
    const q = threadSearch.trim().toLowerCase();
    if (!q) return listThreads;
    return listThreads.filter((t) => {
      const c = classificationMap.get(t.id);
      return (
        t.subject.toLowerCase().includes(q) ||
        t.snippet.toLowerCase().includes(q) ||
        (c?.sender ?? "").toLowerCase().includes(q) ||
        t.participants.some((p) => p.email.toLowerCase().includes(q))
      );
    });
  }, [listThreads, threadSearch, classificationMap]);

  const selectedThread = liveThreads.find((t) => t.id === selectedThreadId) ?? null;
  const agentOpenThread = useMemo(() => {
    if (!selectedThread) return null;
    const attachments = selectedThread.messages.flatMap((message) =>
      message.attachments.map((att) => ({
        messageId: message.id,
        attachmentId: att.id,
        filename: att.filename,
        mimeType: att.mimeType,
        sizeBytes: att.size,
      }))
    );
    if (attachments.length === 0) return null;
    return { threadId: selectedThread.id, attachments };
  }, [selectedThread]);
  const selectedClassification = selectedThreadId ? classificationMap.get(selectedThreadId) : undefined;

  const counterpartyEmail = useMemo(() => {
    if (!selectedThread) return null;
    return (
      selectedThread.participants.find(
        (p) => p.email.toLowerCase() !== userEmail.toLowerCase()
      )?.email ?? null
    );
  }, [selectedThread, userEmail]);

  const { data: sendTimeFromQuery } = useSendTimeSuggestion(
    counterpartyEmail,
    selectedThreadId,
    composerOpen
  );
  const sendTimeSuggestion = sendTimeFromQuery ?? null;

  const threadMeetingsMap = useMemo(
    () => new Map(threadMeetings.map((meeting) => [meeting.threadId, meeting])),
    [threadMeetings]
  );

  const calendarEventsMap = useMemo(
    () => new Map(calendarEvents.map((event) => [event.id, event])),
    [calendarEvents]
  );

  const selectedLinkedMeeting = selectedThreadId
    ? threadMeetingsMap.get(selectedThreadId) ?? null
    : null;

  const selectedLinkedEvent = selectedLinkedMeeting
    ? calendarEventsMap.get(selectedLinkedMeeting.eventId) ?? null
    : null;

  const selectedRsvpSummary = useMemo(
    () => summarizeRsvp(selectedLinkedEvent, userEmail),
    [selectedLinkedEvent, userEmail]
  );

  const rsvpByThread = useMemo(() => {
    const map = new Map<string, ReturnType<typeof summarizeRsvp>>();
    for (const meeting of threadMeetings) {
      const event = calendarEventsMap.get(meeting.eventId) ?? null;
      map.set(meeting.threadId, summarizeRsvp(event, userEmail));
    }
    return map;
  }, [threadMeetings, calendarEventsMap, userEmail]);

  const meetingAttendees = useMemo(() => {
    if (!selectedThread) return [];
    return resolveMeetingAttendees(
      selectedThread,
      selectedClassification?.schedulingIntent ?? null,
      userEmail
    );
  }, [selectedThread, selectedClassification, userEmail]);

  useEffect(() => {
    setLiveThreads(initialThreads);
  }, [initialThreads]);

  useEffect(() => {
    setClassifications(initialClassifications);
  }, [initialClassifications]);

  useEffect(() => {
    setCalendarEvents(initialEvents);
  }, [initialEvents]);

  useEffect(() => {
    setThreadMeetings(initialThreadMeetings);
  }, [initialThreadMeetings]);

  const loadCalendarMonth = useCallback(async (month: Date) => {
    const monthKey = format(month, "yyyy-MM");
    try {
      const { events } = await fetchCalendarEventsApi(monthKey);
      setCalendarEvents((prev) => {
        const rest = prev.filter((event) => format(event.start, "yyyy-MM") !== monthKey);
        const fresh = events.map((event) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end),
        }));
        return [...rest, ...fresh].sort((a, b) => a.start.getTime() - b.start.getTime());
      });
    } catch {
      /* keep existing events */
    }
  }, []);

  useEffect(() => {
    setAvailabilityOpen(false);
    setAgentSchedulingIntent(null);
  }, [selectedThreadId]);

  useEffect(() => {
    if (!availabilityOpen) {
      setAgentSchedulingIntent(null);
    }
  }, [availabilityOpen]);

  useEffect(() => {
    if (!availabilityOpen) {
      setAttendeeBusy([]);
      return;
    }

    const externalAttendees = meetingAttendees.filter(
      (email) => email.toLowerCase() !== userEmail.toLowerCase()
    );
    if (externalAttendees.length === 0) {
      setAttendeeBusy([]);
      return;
    }

    const start = new Date();
    const end = addDays(start, 14);
    let cancelled = false;

    void fetchFreeBusyApi(externalAttendees, start, end)
      .then(({ busy }) => {
        if (cancelled) return;
        const intervals: BusyInterval[] = [];
        for (const windows of Object.values(busy)) {
          for (const window of windows) {
            intervals.push({
              start: new Date(window.start),
              end: new Date(window.end),
            });
          }
        }
        setAttendeeBusy(intervals);
      })
      .catch(() => {
        if (!cancelled) setAttendeeBusy([]);
      });

    return () => {
      cancelled = true;
    };
  }, [availabilityOpen, meetingAttendees, userEmail]);



  const [indexStatus, setIndexStatus] = useState(initialIndexStatus);

  useEffect(() => {
    setIndexStatus(initialIndexStatus);
  }, [initialIndexStatus]);

  useEffect(() => {
    if (!backfillComplete) {
      setActivities((prev) => {
        if (prev.some((a) => a.id === "backfill")) return prev;
        return [
          {
            id: "backfill",
            type: "background",
            label: "Setting up inbox",
            detail: "Classifying recent threads…",
            progress: 0,
          },
          ...prev,
        ];
      });
      return;
    }

    if (!indexStatus.fullIndexComplete) {
      const pct =
        indexStatus.inboxTotalThreads != null && indexStatus.inboxTotalThreads > 0
          ? Math.round((indexStatus.indexedCount / indexStatus.inboxTotalThreads) * 100)
          : 0;
      setActivities((prev) => {
        if (prev.some((a) => a.id === "full-index")) return prev;
        return [
          {
            id: "full-index",
            type: "background",
            label: "Indexing inbox",
            detail: formatFullIndexBannerDetail(indexStatus),
            progress: pct,
          },
          ...prev,
        ];
      });
    }
  }, [backfillComplete, indexStatus]);

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mailboxViewRef = useRef(mailboxView);
  mailboxViewRef.current = mailboxView;

  const syncInbox = useCallback(async () => {
    try {
      const serialized = await fetchInboxSyncApi();
      const data = deserializeInboxData(serialized);
      setLiveThreads(data.threads);
      setClassifications(data.classifications);
      setCalendarEvents(data.events);
      setThreadMeetings(data.threadMeetings);
      setSelectedThreadId((prev) => {
        if (!prev) return prev;
        if (data.threads.some((thread) => thread.id === prev)) return prev;
        const next = data.threads.find(
          (thread) =>
            data.classifications.find((classification) => classification.threadId === thread.id)
              ?.lane === activeLane
        );
        return next?.id ?? data.threads[0]?.id ?? null;
      });
      if (mailboxViewRef.current === "sent") {
        const { threads } = await fetchMailboxThreadsApi("sent");
        setSentThreads(deserializeThreads(threads));
      }
    } catch {
      /* ignore transient sync errors */
    }
  }, [activeLane]);

  const scheduleSyncInbox = useCallback(() => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = setTimeout(() => {
      syncTimerRef.current = null;
      void syncInbox();
    }, 400);
  }, [syncInbox]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void syncInbox();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [syncInbox]);

  useEffect(
    () => () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    },
    []
  );

  const handleRealtimeEvent = useCallback((event: InboxRealtimeEvent) => {
    if (event.type === "inbox-changed") {
      scheduleSyncInbox();
      void queryClient.invalidateQueries({ queryKey: inboxQueryKeys.all });
      return;
    }
    if (event.type === "classification-updated") {
      setClassifications((prev) => mergeClassifications(prev, event.classification));
      setBriefInvalidationKey((key) => key + 1);
      scheduleSyncInbox();
      return;
    }
    if (event.type === "calendar-updated") {
      if (event.events && event.month) {
        setCalendarEvents((prev) => {
          const rest = prev.filter((item) => format(item.start, "yyyy-MM") !== event.month);
          const fresh = event.events!.map((item) => ({
            ...item,
            start: new Date(item.start),
            end: new Date(item.end),
          }));
          return [...rest, ...fresh].sort((a, b) => a.start.getTime() - b.start.getTime());
        });
      } else {
        void loadCalendarMonth(new Date());
      }
      setBriefInvalidationKey((key) => key + 1);
      void queryClient.invalidateQueries({ queryKey: [...inboxQueryKeys.all, "events"] });
      scheduleSyncInbox();
      return;
    }
    if (event.type === "backfill-progress") {
      const pct = event.total > 0 ? Math.round((event.completed / event.total) * 100) : 0;
      setActivities((prev) =>
        prev.map((a) =>
          a.id === "backfill"
            ? {
                ...a,
                detail: `Classifying recent threads… ${event.completed}/${event.total}`,
                progress: pct,
              }
            : a
        )
      );
    }
    if (event.type === "backfill-complete") {
      setActivities((prev) => prev.filter((a) => a.id !== "backfill"));
      scheduleSyncInbox();
    }
    if (event.type === "full-index-progress") {
      const pct = event.total > 0 ? Math.round((event.completed / event.total) * 100) : 0;
      setIndexStatus((prev) => ({
        ...prev,
        quickBackfillComplete: true,
        fullIndexComplete: false,
        indexedCount: event.completed,
        inboxTotalThreads: event.total,
        remainingThreads: event.remaining,
      }));
      setActivities((prev) => {
        const detail = `Indexing ${event.remaining} more threads… (${event.completed}/${event.total})`;
        const existing = prev.find((a) => a.id === "full-index");
        if (existing) {
          return prev.map((a) =>
            a.id === "full-index" ? { ...a, detail, progress: pct } : a
          );
        }
        return [
          {
            id: "full-index",
            type: "background",
            label: "Indexing inbox",
            detail,
            progress: pct,
          },
          ...prev,
        ];
      });
    }
    if (event.type === "full-index-complete") {
      setIndexStatus((prev) => ({
        ...prev,
        quickBackfillComplete: true,
        fullIndexComplete: true,
        indexedCount: event.indexed,
        inboxTotalThreads: event.total,
        remainingThreads: 0,
      }));
      setActivities((prev) => prev.filter((a) => a.id !== "full-index"));
      scheduleSyncInbox();
    }
    if (event.type === "reembed-progress") {
      const pct = event.total > 0 ? Math.round((event.completed / event.total) * 100) : 0;
      setActivities((prev) => {
        const existing = prev.find((a) => a.id === "reembed");
        if (existing) {
          return prev.map((a) =>
            a.id === "reembed"
              ? {
                  ...a,
                  detail: `Re-indexing search… ${event.completed}/${event.total}`,
                  progress: pct,
                }
              : a
          );
        }
        return [
          {
            id: "reembed",
            type: "background",
            label: "Re-indexing search",
            detail: `Re-indexing search… ${event.completed}/${event.total}`,
            progress: pct,
          },
          ...prev,
        ];
      });
    }
    if (event.type === "reembed-complete") {
      setActivities((prev) => prev.filter((a) => a.id !== "reembed"));
      scheduleSyncInbox();
    }
  }, [loadCalendarMonth, scheduleSyncInbox]);

  const pollInbox = useCallback(() => {
    scheduleSyncInbox();
  }, [scheduleSyncInbox]);

  useInboxRealtime(userId, handleRealtimeEvent, pollInbox);

  const showUndo = useCallback((message: string, onUndo: () => void) => {
    setUndo({ message, onUndo });
  }, []);

  const loadCommitments = useCallback(async (view: "commitments" | "waiting") => {
    const data = await fetchCommitmentsApi(view);
    setCommitmentItems(data.commitments);
  }, []);

  const loadSentThreads = useCallback(async () => {
    setMailboxLoading(true);
    try {
      const { threads } = await fetchMailboxThreadsApi("sent");
      setSentThreads(deserializeThreads(threads));
    } catch {
      setSentThreads([]);
    } finally {
      setMailboxLoading(false);
    }
  }, []);

  const handleMailboxView = useCallback((view: MailboxView) => {
    setCommitmentsOpen(false);
    setWorkspacePanel("inbox");
    setMailboxView(view);
  }, []);

  const openCommitments = useCallback(
    (view: "commitments" | "waiting") => {
      setWorkspacePanel("inbox");
      setMailboxView("inbox");
      setCommitmentsView(view);
      setCommitmentsOpen(true);
      setCommitmentsLoading(true);
      void loadCommitments(view).finally(() => setCommitmentsLoading(false));
    },
    [loadCommitments]
  );

  const openWaitingFor = useCallback(() => {
    openCommitments("waiting");
  }, [openCommitments]);

  useEffect(() => {
    if (mailboxView === "sent") {
      void loadSentThreads();
    }
  }, [mailboxView, loadSentThreads]);

  useEffect(() => {
    if (!selectedThreadId) {
      setThreadCommitments([]);
      return;
    }
    void fetchCommitmentsApi()
      .then((data) =>
        setThreadCommitments(data.commitments.filter((c) => c.threadId === selectedThreadId))
      )
      .catch(() => setThreadCommitments([]));
  }, [selectedThreadId]);

  const openPreBrief = useCallback(() => {
    if (!selectedThread) return;
    const attendee = selectedThread.participants.find(
      (p) => p.email.toLowerCase() !== userEmail.toLowerCase()
    );
    if (!attendee) return;
    setPreBriefOpen(true);
    setPreBriefLoading(true);
    void fetchPreBriefApi(attendee.email)
      .then((data) => setPreBrief(data.brief))
      .catch(() => setPreBrief(null))
      .finally(() => setPreBriefLoading(false));
  }, [selectedThread, userEmail]);

  const openExportTask = useCallback(() => {
    if (!selectedThread) return;
    setExportOpen(true);
  }, [selectedThread]);

  const addActivity = useCallback((item: ActivityItem) => {
    setActivities((prev) => [...prev, item]);
  }, []);

  const archiveThread = useCallback(
    (threadId: string) => {
      const thread = liveThreads.find((t) => t.id === threadId);
      const previousLane = classificationMap.get(threadId)?.lane ?? "reply";

      setClassifications((prev) =>
        prev.map((c) => (c.threadId === threadId ? { ...c, lane: "done" as const } : c))
      );
      const next = laneThreads.find((t) => t.id !== threadId);
      if (selectedThreadId === threadId) setSelectedThreadId(next?.id ?? null);

      void archiveThreadApi(threadId).catch(() => {
        setClassifications((prev) =>
          prev.map((c) => (c.threadId === threadId ? { ...c, lane: previousLane } : c))
        );
        setSelectedThreadId(threadId);
      });

      showUndo(`Archived "${thread?.subject.slice(0, 40)}…"`, () => {
        setClassifications((prev) =>
          prev.map((c) => (c.threadId === threadId ? { ...c, lane: previousLane } : c))
        );
        setSelectedThreadId(threadId);
        void restoreThreadApi(threadId, previousLane).catch(() => undefined);
      });
    },
    [liveThreads, laneThreads, selectedThreadId, showUndo, classificationMap]
  );

  const snoozeThread = useCallback(
    (threadId: string, until: Date, label: string) => {
      const thread = liveThreads.find((t) => t.id === threadId);
      const activityId = `snooze-${threadId}-${Date.now()}`;

      setSnoozed((prev) => [...prev.filter((s) => s.threadId !== threadId), { threadId, until, label }]);
      const next = laneThreads.find((t) => t.id !== threadId);
      if (selectedThreadId === threadId) setSelectedThreadId(next?.id ?? null);

      addActivity({
        id: activityId,
        type: "snooze",
        label: `Snoozed: ${thread?.subject.slice(0, 30)}…`,
        detail: label,
        at: until,
      });

      void snoozeThreadApi(threadId, until).catch(() => {
        setSnoozed((prev) => prev.filter((s) => s.threadId !== threadId));
        setSelectedThreadId(threadId);
      });

      showUndo(`Snoozed until ${label}`, () => {
        setSnoozed((prev) => prev.filter((s) => s.threadId !== threadId));
        setActivities((prev) => prev.filter((a) => a.id !== activityId));
        setSelectedThreadId(threadId);
        void unsnoozeThreadApi(threadId).catch(() => undefined);
      });
    },
    [liveThreads, laneThreads, selectedThreadId, showUndo, addActivity]
  );

  const openSnooze = useCallback(() => {
    setSnoozeOpen(true);
  }, []);

  const navigateThread = useCallback(
    (direction: 1 | -1) => {
      if (filteredLaneThreads.length === 0) return;
      const idx = filteredLaneThreads.findIndex((t) => t.id === selectedThreadId);
      const nextIdx =
        idx === -1 ? 0 : (idx + direction + filteredLaneThreads.length) % filteredLaneThreads.length;
      setSelectedThreadId(filteredLaneThreads[nextIdx].id);
    },
    [filteredLaneThreads, selectedThreadId]
  );

  const openReplyComposer = useCallback(() => {
    if (!selectedThreadId) return;
    setComposerOpen(true);
    setComposerDraft("<p></p>");
    setDraftLoading(true);
    void generateDraftApi(selectedThreadId, "professional")
      .then((result) => {
        setComposerDraft(result.draftHtml);
        if (result.source === "template") {
          showUndo("AI quota exhausted — template draft inserted", () => undefined);
        }
      })
      .catch(() => {
        showUndo("AI draft unavailable — write your reply manually", () => undefined);
      })
      .finally(() => setDraftLoading(false));
  }, [selectedThreadId, showUndo]);

  const handleCancelMeeting = useCallback(async () => {
    if (!selectedThreadId || !selectedLinkedMeeting) return;

    const snapshot = selectedLinkedMeeting;
    const snapshotEvent = selectedLinkedEvent;

    setThreadMeetings((prev) => prev.filter((meeting) => meeting.threadId !== selectedThreadId));
    setCalendarEvents((prev) => prev.filter((event) => event.id !== snapshot.eventId));

    try {
      await cancelMeetingApi(selectedThreadId);
      showUndo("Meeting cancelled — attendees notified", () => undefined);
    } catch (error) {
      setThreadMeetings((prev) => [...prev, snapshot]);
      if (snapshotEvent) {
        setCalendarEvents((prev) => [...prev, snapshotEvent]);
      }
      showUndo(
        error instanceof Error ? error.message : "Could not cancel meeting",
        () => undefined
      );
    }
  }, [selectedLinkedEvent, selectedLinkedMeeting, selectedThreadId, showUndo]);

  const openAgentMeetingPicker = useCallback(
    (input: Record<string, unknown>) => {
      const intent = schedulingIntentFromAgentInvite(input);
      if (intent) {
        setAgentSchedulingIntent(intent);
        const duration = intent.duration;
        setMeetingDurationMinutes((duration === 45 || duration === 60 ? duration : 30) as 30 | 45 | 60);
      }
      if (selectedThreadId && threadMeetingsMap.has(selectedThreadId)) {
        setAvailabilityMode("reschedule");
      } else {
        setAvailabilityMode("create");
      }
      setAvailabilityOpen(true);
      setWorkspacePanel("inbox");
    },
    [selectedThreadId, threadMeetingsMap]
  );

  const confirmRescheduleMeeting = useCallback(() => {
    if (!selectedThreadId) return;
    setRescheduleConfirmOpen(false);
    setAvailabilityMode("reschedule");
    setAvailabilityOpen(true);
  }, [selectedThreadId]);

  const openScheduleMeeting = useCallback(() => {
    if (!selectedThreadId) return;
    const intentDuration = classificationMap.get(selectedThreadId)?.schedulingIntent?.duration;
    const linkedDuration = threadMeetingsMap.get(selectedThreadId)?.durationMinutes;
    const d = linkedDuration ?? intentDuration ?? 30;
    setMeetingDurationMinutes((d === 45 || d === 60 ? d : 30) as 30 | 45 | 60);
    setWorkspacePanel("inbox");
    if (threadMeetingsMap.has(selectedThreadId)) {
      setRescheduleConfirmOpen(true);
      return;
    }
    setAvailabilityMode("create");
    setAvailabilityOpen(true);
  }, [selectedThreadId, threadMeetingsMap, classificationMap]);

  const handleAction = useCallback(
    (action: string) => {
      switch (action) {
        case "nextThread":
          navigateThread(1);
          break;
        case "prevThread":
          navigateThread(-1);
          break;
        case "archive":
          if (selectedThreadId) archiveThread(selectedThreadId);
          break;
        case "reply":
          openReplyComposer();
          break;
        case "meeting":
          openScheduleMeeting();
          break;
        case "snooze":
          openSnooze();
          break;
        case "palette":
          setPaletteOpen(true);
          break;
        case "help":
          setCheatsheetOpen((open) => !open);
          break;
        case "select":
          setMultiSelectMode((v) => !v);
          setSelectedIds(new Set());
          break;
        case "search":
          setSearchOpen(true);
          break;
        case "advancedSearch":
          setAdvancedSearchOpen(true);
          break;
        case "cancelMeeting":
          void handleCancelMeeting();
          break;
        case "waitingFor":
          openWaitingFor();
          break;
        case "preBrief":
          openPreBrief();
          break;
        case "exportTask":
          openExportTask();
          break;
        case "fulfillCommitment": {
          const pending = threadCommitments.find((c) => c.status === "open");
          if (pending) {
            void patchCommitmentApi(pending.id, "fulfilled").then(() => {
              setThreadCommitments((prev) => prev.filter((c) => c.id !== pending.id));
              showUndo("Commitment marked fulfilled", () => undefined);
            });
          }
          break;
        }
        default:
          break;
      }
    },
    [
      archiveThread,
      handleCancelMeeting,
      navigateThread,
      openExportTask,
      openPreBrief,
      openReplyComposer,
      openScheduleMeeting,
      openSnooze,
      openWaitingFor,
      selectedThreadId,
      showUndo,
      threadCommitments,
    ]
  );

  const shortcutState = useMemo(
    () => ({
      composerOpen,
      paletteOpen,
      snoozeOpen,
      availabilityOpen,
      cheatsheetOpen,
      searchOpen,
      advancedSearchOpen,
      selectedThreadId,
    }),
    [
      availabilityOpen,
      cheatsheetOpen,
      composerOpen,
      paletteOpen,
      searchOpen,
      advancedSearchOpen,
      selectedThreadId,
      snoozeOpen,
    ]
  );

  useInboxShortcuts(shortcutState, isMac, handleAction);
  const closeComposer = useCallback(() => {
    setComposerOpen(false);
    setComposerDraft("");
  }, []);

  useHotkeys(
    "escape",
    () => {
      if (snoozeOpen) setSnoozeOpen(false);
      else if (availabilityOpen) setAvailabilityOpen(false);
      else if (composerOpen) closeComposer();
      else if (cheatsheetOpen) setCheatsheetOpen(false);
      else if (paletteOpen) setPaletteOpen(false);
    },
    { enableOnContentEditable: composerOpen },
    [availabilityOpen, cheatsheetOpen, closeComposer, composerOpen, paletteOpen, snoozeOpen],
  );

  useEffect(() => {
    const onIframeHotkey = (event: Event) => {
      if (composerOpen || paletteOpen || snoozeOpen || availabilityOpen || cheatsheetOpen) return;
      const key = (event as CustomEvent<{ key: string }>).detail?.key;
      if (!key || !selectedThreadId) return;

      const actionByKey: Record<string, string> = {
        j: "nextThread",
        k: "prevThread",
        e: "archive",
        r: "reply",
        m: "meeting",
        s: "snooze",
      };
      const action = actionByKey[key];
      if (action) handleAction(action);
    };

    window.addEventListener("inbox-hotkey", onIframeHotkey);
    return () => window.removeEventListener("inbox-hotkey", onIframeHotkey);
  }, [
    availabilityOpen,
    cheatsheetOpen,
    composerOpen,
    handleAction,
    paletteOpen,
    selectedThreadId,
    snoozeOpen,
  ]);

  const meetingDuration =
    meetingDurationMinutes ??
    selectedLinkedMeeting?.durationMinutes ??
    selectedClassification?.schedulingIntent?.duration ??
    30;

  const freeSlots = useMemo(() => {
    const eventsForSlots =
      selectedLinkedMeeting && availabilityMode === "reschedule"
        ? calendarEvents.filter((event) => event.id !== selectedLinkedMeeting.eventId)
        : calendarEvents;
    const excludeEventId =
      availabilityMode === "reschedule" && selectedLinkedMeeting
        ? selectedLinkedMeeting.eventId
        : undefined;
    return computeFreeSlots(eventsForSlots, meetingDuration, new Date(), {
      workingDays: workingDaysStructured,
      excludeEventId,
    });
  }, [
    calendarEvents,
    meetingDuration,
    selectedLinkedMeeting,
    availabilityMode,
    workingDaysStructured,
  ]);

  const handleMeetingSlot = useCallback(
    async (slot: Date) => {
      if (!selectedThreadId || !selectedThread) return;

      const isReschedule = availabilityMode === "reschedule" && !!selectedLinkedMeeting;
      const excludeEventId =
        isReschedule && selectedLinkedMeeting ? selectedLinkedMeeting.eventId : undefined;
      const slotEnd = addMinutes(slot, meetingDuration);
      const eventsForCheck =
        excludeEventId != null
          ? calendarEvents.filter((event) => event.id !== excludeEventId)
          : calendarEvents;

      if (isSlotBusy(eventsForCheck, slot, slotEnd)) {
        const alternative = findNearestFreeSlot(eventsForCheck, meetingDuration, slot, {
          excludeEventId,
          workingDays: workingDaysStructured,
        });
        if (alternative) {
          showUndo(
            `That time conflicts — using ${format(alternative, "EEE h:mm a")} instead`,
            () => undefined
          );
          slot = alternative;
        } else {
          showUndo("That time conflicts with another event — pick a different slot", () => undefined);
          setAvailabilityOpen(true);
          return;
        }
      }

      const previousLane = selectedClassification?.lane ?? "reply";
      const previousMeeting = selectedLinkedMeeting;
      setAvailabilityOpen(false);

      const buildEvent = (eventId: string, hangoutLink?: string): CalendarEvent => ({
        id: eventId,
        summary: selectedThread.subject,
        start: slot,
        end: new Date(slot.getTime() + meetingDuration * 60_000),
        attendees: meetingAttendees.map((email) => ({
          email,
          name: email,
          responseStatus: "needsAction" as const,
        })),
        organizer: { email: userEmail, name: userEmail },
        status: "confirmed",
        location: hangoutLink,
      });

      try {
        const result = isReschedule
          ? await updateMeetingApi({
              threadId: selectedThreadId,
              slotStart: slot,
              durationMinutes: meetingDuration,
            })
          : await createMeetingApi({
              threadId: selectedThreadId,
              slotStart: slot,
              durationMinutes: meetingDuration,
            });

        const meeting: ThreadMeeting = {
          threadId: selectedThreadId,
          eventId: result.eventId,
          start: new Date(result.meeting.start),
          durationMinutes: result.meeting.durationMinutes,
        };

        setThreadMeetings((prev) => {
          const rest = prev.filter((item) => item.threadId !== selectedThreadId);
          return [...rest, meeting];
        });

        setCalendarEvents((prev) => {
          const rest = prev.filter((event) => event.id !== result.eventId);
          return [...rest, buildEvent(result.eventId, result.hangoutLink)];
        });

        if (!isReschedule) {
          setClassifications((prev) =>
            prev.map((c) =>
              c.threadId === selectedThreadId ? { ...c, lane: "done" as const } : c
            )
          );
          const next = laneThreads.find((t) => t.id !== selectedThreadId);
          setSelectedThreadId(next?.id ?? null);
        }

        setComposerDraft(result.draftHtml);
        setComposerOpen(true);

        showUndo(
          isReschedule ? "Meeting rescheduled — updated draft ready" : "Meeting created — confirmation draft ready",
          () => undefined
        );
        promptUnknownContacts(meetingAttendees);
      } catch (error) {
        setAvailabilityOpen(true);
        if (previousMeeting) {
          setThreadMeetings((prev) => {
            const rest = prev.filter((item) => item.threadId !== selectedThreadId);
            return [...rest, previousMeeting];
          });
        }
        if (!isReschedule) {
          setClassifications((prev) =>
            prev.map((c) =>
              c.threadId === selectedThreadId ? { ...c, lane: previousLane } : c
            )
          );
        }
        showUndo(
          error instanceof Error ? error.message : "Could not save meeting",
          () => undefined
        );
      }
    },
    [
      availabilityMode,
      calendarEvents,
      laneThreads,
      meetingAttendees,
      meetingDuration,
      promptUnknownContacts,
      selectedClassification,
      selectedLinkedMeeting,
      selectedThread,
      selectedThreadId,
      showUndo,
      userEmail,
      workingDaysStructured,
    ]
  );

  const retryPendingCustomSlot = useCallback(
    (slot: Date) => {
      setPendingCustomSlot(null);
      void handleMeetingSlot(slot);
    },
    [handleMeetingSlot]
  );

  const handleCustomScheduleSubmit = useCallback(
    async (slot: Date) => {
      if (rescheduleConflictEvent) {
        const durationMinutes = Math.max(
          15,
          differenceInMinutes(rescheduleConflictEvent.end, rescheduleConflictEvent.start)
        );
        try {
          const updated = await rescheduleCalendarEventApi({
            eventId: rescheduleConflictEvent.id,
            slotStart: slot,
            durationMinutes,
          });
          setCalendarEvents((prev) =>
            prev
              .filter((event) => event.id !== updated.eventId)
              .concat([
                {
                  ...rescheduleConflictEvent,
                  id: updated.eventId,
                  start: new Date(updated.start),
                  end: new Date(updated.end),
                },
              ])
              .sort((a, b) => a.start.getTime() - b.start.getTime())
          );
          setRescheduleConflictEvent(null);
          setCustomScheduleOpen(false);
          showUndo("Conflicting event rescheduled", () => undefined);
          if (pendingCustomSlot) {
            retryPendingCustomSlot(pendingCustomSlot);
          }
        } catch (error) {
          showUndo(
            error instanceof Error ? error.message : "Could not reschedule event",
            () => undefined
          );
        }
        return;
      }

      const excludeEventId =
        availabilityMode === "reschedule" && selectedLinkedMeeting
          ? selectedLinkedMeeting.eventId
          : undefined;
      const eventsForCheck =
        excludeEventId != null
          ? calendarEvents.filter((event) => event.id !== excludeEventId)
          : calendarEvents;
      const slotEnd = addMinutes(slot, meetingDuration);
      const conflict = findConflictingEvent(eventsForCheck, slot, slotEnd, excludeEventId);

      if (conflict) {
        setOverlapConflict(conflict);
        setOverlapProposedStart(slot);
        setPendingCustomSlot(slot);
        setCustomScheduleOpen(false);
        setOverlapModalOpen(true);
        return;
      }

      setCustomScheduleOpen(false);
      void handleMeetingSlot(slot);
    },
    [
      availabilityMode,
      calendarEvents,
      handleMeetingSlot,
      meetingDuration,
      pendingCustomSlot,
      rescheduleConflictEvent,
      retryPendingCustomSlot,
      selectedLinkedMeeting,
      showUndo,
    ]
  );

  const handleComposerSend = useCallback(
    async (bodyHtml: string, attachmentIds?: string[]) => {
      if (!selectedThread) return;

      const subject = selectedThread.subject.startsWith("Re:")
        ? selectedThread.subject
        : `Re: ${selectedThread.subject}`;
      const to = replyRecipients(selectedThread, userEmail);

      try {
        const queued = await queueSendApi({
          to,
          subject,
          body: bodyHtml,
          threadId: selectedThread.id,
          attachmentIds,
        });

        setComposerOpen(false);
        let cancelled = false;
        const timer = window.setTimeout(() => {
          if (!cancelled) {
            void dispatchSendApi(queued.scheduledSendId).catch(() => undefined);
          }
        }, queued.undoWindowMs || 5000);

        showUndo("Sending in 5s — undo to cancel", () => {
          cancelled = true;
          window.clearTimeout(timer);
          void cancelSendApi(queued.scheduledSendId).catch(() => undefined);
          setComposerOpen(true);
        });
        promptUnknownContacts(to);
      } catch (error) {
        showUndo(error instanceof Error ? error.message : "Send failed", () => undefined);
      }
    },
    [selectedThread, userEmail, showUndo, promptUnknownContacts]
  );

  const laneCounts = useMemo(() => {
    const counts: Record<TriageLane, number> = { reply: 0, schedule: 0, fyi: 0, done: 0 };
    classifications.forEach((c) => {
      if (!snoozedIds.has(c.threadId)) counts[c.lane]++;
    });
    return counts;
  }, [classifications, snoozedIds]);

  const handleSendLater = useCallback(
    async (bodyHtml: string, suggestedAt?: Date, attachmentIds?: string[]) => {
      if (!selectedThread || !bodyHtml.trim()) return;

      const sendAt = suggestedAt ?? new Date(Date.now() + 3_600_000);
      const subject = selectedThread.subject.startsWith("Re:")
        ? selectedThread.subject
        : `Re: ${selectedThread.subject}`;
      const to = replyRecipients(selectedThread, userEmail);
      const activityId = `send-${Date.now()}`;

      try {
        const queued = await queueSendApi({
          to,
          subject,
          body: bodyHtml,
          threadId: selectedThread.id,
          sendAt,
          attachmentIds,
        });

        addActivity({
          id: activityId,
          type: "scheduled_send",
          label: `Send later: ${selectedThread.subject.slice(0, 30)}…`,
          detail: format(sendAt, "h:mm a · MMM d"),
          at: sendAt,
          scheduledSendId: queued.scheduledSendId,
        });
        setComposerOpen(false);

        showUndo("Scheduled send — undo to cancel", () => {
          setActivities((prev) => prev.filter((a) => a.id !== activityId));
          void cancelSendApi(queued.scheduledSendId).catch(() => undefined);
        });
      } catch (error) {
        showUndo(error instanceof Error ? error.message : "Schedule failed", () => undefined);
      }
    },
    [selectedThread, userEmail, addActivity, showUndo]
  );

  const selectThread = useCallback(
    (threadId: string) => {
      setSelectedThreadId(threadId);
      if (isMobile) setMobileThreadOpen(true);
    },
    [isMobile]
  );

  const quickSnoozeThread = useCallback((threadId: string) => {
    setSelectedThreadId(threadId);
    setSnoozeOpen(true);
  }, []);

  const handleLongPressThread = useCallback((threadId: string) => {
    setMultiSelectMode(true);
    setSelectedIds(new Set([threadId]));
  }, []);

  const handleSuggestedAction = useCallback(
    (action: SuggestedAction) => {
      const runAfterSelect = (threadId: string | undefined, fn: () => void) => {
        if (threadId) {
          setWorkspacePanel("inbox");
          setSelectedThreadId(threadId);
          if (isMobile) {
            setMobileTab("inbox");
            setMobileThreadOpen(true);
          }
          queueMicrotask(fn);
          return;
        }
        fn();
      };

      switch (action.type) {
        case "reply":
          runAfterSelect(action.threadId, () => openReplyComposer());
          break;
        case "compose":
          runAfterSelect(action.threadId, () => {
            openReplyComposer();
            if (action.draftText) setComposerDraft(action.draftText);
          });
          break;
        case "archive":
          if (action.threadId) void archiveThread(action.threadId);
          break;
        case "schedule":
          runAfterSelect(action.threadId, () => openScheduleMeeting());
          break;
        case "snooze":
          runAfterSelect(action.threadId, () => openSnooze());
          break;
        case "open_thread":
          if (action.threadId) {
            setWorkspacePanel("inbox");
            setSelectedThreadId(action.threadId);
            if (isMobile) {
              setMobileTab("inbox");
              setMobileThreadOpen(true);
            }
          }
          break;
      }
    },
    [archiveThread, isMobile, openReplyComposer, openScheduleMeeting, openSnooze]
  );

  const handleBlockFocusTime = useCallback(
    async (start: Date, durationMinutes: number) => {
      try {
        const result = await createFocusBlockApi({ start, durationMinutes });
        const event: CalendarEvent = {
          id: result.eventId,
          summary: result.summary,
          start: new Date(result.start),
          end: new Date(result.end),
          attendees: [],
          organizer: { email: userEmail, name: userEmail },
          status: "confirmed",
        };
        setCalendarEvents((prev) =>
          [...prev.filter((item) => item.id !== event.id), event].sort(
            (a, b) => a.start.getTime() - b.start.getTime()
          )
        );
        showUndo(`Focus time blocked — ${format(start, "EEE h:mm a")}`, () => {
          void deleteFocusBlockApi(result.eventId)
            .then(() => {
              setCalendarEvents((prev) => prev.filter((item) => item.id !== result.eventId));
            })
            .catch(() => undefined);
        });
      } catch (error) {
        showUndo(
          error instanceof Error ? error.message : "Could not block focus time",
          () => undefined
        );
        throw error;
      }
    },
    [showUndo, userEmail]
  );

  const renderCalendarContent = () =>
    defragOpen ? (
      <DefragPanel
        events={calendarEvents}
        onClose={() => setDefragOpen(false)}
        onBlockFocusTime={handleBlockFocusTime}
      />
    ) : (
      <CalendarPanel
        events={calendarEvents}
        searchQuery={calendarSearch}
        onSearchChange={setCalendarSearch}
        onMonthChange={loadCalendarMonth}
        onDefrag={() => setDefragOpen(true)}
        threadMeetingEventIds={threadMeetingEventIds}
        onOpenPreBrief={(email) => {
          setPreBriefOpen(true);
          setPreBriefLoading(true);
          void fetchPreBriefApi(email)
            .then((data) => setPreBrief(data.brief))
            .catch(() => setPreBrief(null))
            .finally(() => setPreBriefLoading(false));
        }}
      />
    );

  const renderListPanel = (touchEnabled: boolean) => (
    <aside className="relative flex h-full flex-col overflow-hidden border-r border-hairline bg-canvas">
      {mailboxView === "inbox" && (
        <div className="sticky top-0 z-10 flex border-b border-hairline bg-canvas">
          {ACTIVE_LANES.map((lane) => {
            const isActive = activeLane === lane;
            return (
              <button
                key={lane}
                type="button"
                onClick={() => setActiveLane(lane)}
                className={`flex-1 px-4 py-3 type-caption-strong uppercase transition-colors flex items-center justify-between ${
                  isActive
                    ? "text-primary"
                    : "text-ink-muted-48 hover:text-ink-muted-80"
                }`}
                style={{ letterSpacing: "0.06em" }}
              >
                <span>{laneLabels[lane]}</span>
                <span
                  className={`type-fine ${
                    isActive ? "text-primary" : "text-ink-muted-48"
                  }`}
                >
                  {laneCounts[lane]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {mailboxView !== "inbox" && (
        <div className="border-b border-hairline px-4 py-3">
          <p className="type-caption-strong text-ink uppercase" style={{ letterSpacing: "0.06em" }}>
            {mailboxView === "sent"
              ? "Sent"
              : mailboxView === "snoozed"
                ? "Snoozed"
                : "Archive"}
          </p>
        </div>
      )}

      <div className="border-b border-divider-soft px-4 py-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted-48"
            strokeWidth={1.75}
          />
          <Input
            value={threadSearch}
            onChange={(e) => setThreadSearch(e.target.value)}
            placeholder="Filter threads…"
            className="h-9 rounded-full border-hairline bg-canvas pl-9 type-caption text-ink placeholder:text-ink-muted-48"
          />
        </div>
      </div>

      {multiSelectMode && (
        <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-3 py-2">
          <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              selectedIds.forEach((id) => archiveThread(id));
              setSelectedIds(new Set());
              setMultiSelectMode(false);
            }}
          >
            Archive
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSnoozeOpen(true)}
          >
            Snooze
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        {mailboxLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-[72px] w-full rounded-[12px]" />
            ))}
          </div>
        ) : filteredListThreads.length === 0 ? (
          <MailboxEmptyState
            variant={
              mailboxView === "sent"
                ? "sent"
                : mailboxView === "snoozed"
                  ? "snoozed"
                  : mailboxView === "archive"
                    ? "archive"
                    : "inbox-lane"
            }
            laneLabel={laneLabels[activeLane]}
            onAction={() => {
              if (mailboxView === "sent") {
                setComposerOpen(true);
                setComposerDraft("");
                return;
              }
              handleMailboxView("inbox");
            }}
          />
        ) : (
          <ThreadList
            lane={mailboxView === "archive" ? "done" : activeLane}
            threads={filteredListThreads}
            classifications={classificationMap}
            threadMeetings={threadMeetingsMap}
            rsvpByThread={rsvpByThread}
            selectedThreadId={selectedThreadId}
            multiSelectMode={multiSelectMode}
            selectedIds={selectedIds}
            onSelectThread={selectThread}
            onToggleSelect={(id) => {
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              });
            }}
            touchEnabled={touchEnabled}
            onArchiveThread={archiveThread}
            onSnoozeThread={quickSnoozeThread}
            onLongPressThread={handleLongPressThread}
          />
        )}
      </ScrollArea>
      <CommitmentsPanel
        open={commitmentsOpen}
        title={commitmentsView === "waiting" ? "Waiting For" : "Your commitments"}
        focusColumn={commitmentsView}
        loading={commitmentsLoading}
        commitments={commitmentItems}
        onClose={() => setCommitmentsOpen(false)}
        onBrowseInbox={() => {
          setCommitmentsOpen(false);
          handleMailboxView("inbox");
        }}
        onSelectThread={(threadId) => {
          setCommitmentsOpen(false);
          handleMailboxView("inbox");
          setSelectedThreadId(threadId);
        }}
        onFulfill={(id) => {
          void patchCommitmentApi(id, "fulfilled").then(() => loadCommitments(commitmentsView));
        }}
        onDismiss={(id) => {
          void patchCommitmentApi(id, "dismissed").then(() => loadCommitments(commitmentsView));
        }}
      />
    </aside>
  );

  const renderThreadPanel = (onBack?: () => void) => (
    <main className="flex h-full min-w-0 flex-col overflow-hidden">
      {onBack && (
        <div className="flex shrink-0 items-center border-b border-border px-2 py-1.5">
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onBack}>
            ← Back
          </Button>
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <MeetingPreBriefPanel
          open={preBriefOpen}
          loading={preBriefLoading}
          brief={preBrief}
          onClose={() => setPreBriefOpen(false)}
        />
        <ThreadView
          thread={selectedThread}
          modLabel={modLabel}
          linkedMeeting={selectedLinkedMeeting}
          linkedEvent={selectedLinkedEvent}
          rsvpSummary={selectedRsvpSummary}
          availabilityOpen={availabilityOpen}
          availabilityMode={availabilityMode}
          schedulingIntent={
            agentSchedulingIntent ?? selectedClassification?.schedulingIntent ?? null
          }
          freeSlots={freeSlots}
          calendarEvents={calendarEvents}
          meetingDuration={meetingDuration}
          excludeEventId={
            availabilityMode === "reschedule" && selectedLinkedMeeting
              ? selectedLinkedMeeting.eventId
              : undefined
          }
          meetingAttendees={meetingAttendees}
          attendeeBusy={attendeeBusy}
          previousSlotStart={
            availabilityMode === "reschedule" && selectedLinkedMeeting
              ? selectedLinkedMeeting.start
              : null
          }
          onDurationChange={setMeetingDurationMinutes}
          onCustomScheduleTime={() => setCustomScheduleOpen(true)}
          onReply={openReplyComposer}
          onArchive={() => selectedThreadId && archiveThread(selectedThreadId)}
          onSchedule={openScheduleMeeting}
          onSnooze={openSnooze}
          onPreBrief={openPreBrief}
          threadCommitments={threadCommitments}
          onConfirmCommitment={(id) => {
            void confirmCommitmentApi(id).then(() =>
              setThreadCommitments((prev) =>
                prev.map((c) => (c.id === id ? { ...c, status: "open" } : c))
              )
            );
          }}
          onDismissCommitment={(id) => {
            void patchCommitmentApi(id, "dismissed").then(() =>
              setThreadCommitments((prev) => prev.filter((c) => c.id !== id))
            );
          }}
          onCloseAvailability={() => setAvailabilityOpen(false)}
          onSelectSlot={(slot) => {
            void handleMeetingSlot(slot);
          }}
          onRescheduleMeeting={openScheduleMeeting}
          onCancelMeeting={() => {
            void handleCancelMeeting();
          }}
          aiProvider={provider}
          onSuggestedAction={handleSuggestedAction}
        />
      </div>
      <ComposerPanel
        open={composerOpen}
        subject={selectedThread?.subject ?? ""}
        modLabel={modLabel}
        initialContent={composerDraft}
        loading={draftLoading}
        snippets={snippets}
        sendTimeSuggestion={sendTimeSuggestion}
        onClose={closeComposer}
        onSend={handleComposerSend}
        onToneChange={(tone) => {
          if (!selectedThreadId) return;
          setDraftLoading(true);
          void generateDraftApi(selectedThreadId, tone)
            .then((result) => {
              setComposerDraft(result.draftHtml);
              if (result.source === "template") {
                showUndo("AI quota exhausted — template draft inserted", () => undefined);
              }
            })
            .finally(() => setDraftLoading(false));
        }}
        onOpenSendLater={(body, attachmentIds) => {
          setSendLaterBody(body);
          setSendLaterAttachmentIds(attachmentIds ?? []);
          setSendLaterOpen(true);
        }}
        onSendLater={(body, attachmentIds) => handleSendLater(body, undefined, attachmentIds)}
      />
    </main>
  );

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background">
        <header
          className="flex h-11 shrink-0 items-center justify-between border-b border-hairline px-4 supports-[backdrop-filter]:bg-[color:var(--color-canvas-parchment)]/90 backdrop-blur-[20px] backdrop-saturate-[1.8] bg-parchment"
        >
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="type-body-strong text-ink hover:opacity-80 transition-opacity"
            >
              Command Inbox
            </Link>
            <span className="type-caption text-ink-muted-48 hidden md:inline">
              {workspacePanel === "brief"
                ? "/ Daily brief"
                : workspacePanel === "calendar"
                  ? "/ Calendar"
                  : workspacePanel === "inbox"
                    ? "/ Inbox"
                    : "/ Agent"}
            </span>
          </div>

          {/* Center search trigger */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden md:flex h-9 w-full max-w-[320px] items-center gap-2 rounded-full border border-hairline bg-canvas px-4 type-caption text-ink-muted-48 hover:border-[color:var(--color-primary-focus)]/40 transition-colors"
          >
            <Command className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span className="flex-1 text-left">Search or jump to…</span>
            <KbdBadge>{modLabel.replace("⌘", "⌘")}K</KbdBadge>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActivityOpen((v) => !v)}
              className="type-caption text-ink-muted-80 hover:text-ink transition-colors px-2 py-1 flex items-center gap-1.5"
              aria-label="Activity"
            >
              <Activity className="h-4 w-4" strokeWidth={1.75} />
              {activities.length > 0 && (
                <span className="type-fine bg-primary text-on-primary rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center">
                  {activities.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setCheatsheetOpen(true)}
              className="btn-icon-circular btn-icon-circular--sm"
              aria-label="Keyboard shortcuts"
            >
              <Keyboard className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="btn-icon-circular btn-icon-circular--sm"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-hidden pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        <div className="absolute inset-0 hidden lg:flex">
        <PrimaryNav
          workspace={workspacePanel}
          mailboxView={mailboxView}
          onWorkspaceChange={setWorkspacePanel}
          onMailboxView={handleMailboxView}
          inboxCount={laneThreads.length}
          commitmentsOpen={commitmentsOpen}
          commitmentsView={commitmentsView}
          userEmail={userEmail}
          onShortcut={(action) => {
            if (action === "shortcuts") setCheatsheetOpen(true);
            else if (action === "settings") {
              void refreshAiKeysStatus();
              setSettingsOpen(true);
            }
            else if (action === "nav-commitments") openCommitments("commitments");
            else if (action === "nav-waiting") openCommitments("waiting");
          }}
        />
        <Group
          orientation="horizontal"
          className="h-full min-w-0 flex-1"
          defaultLayout={savedLayout ?? DEFAULT_LAYOUT}
          onLayoutChanged={onLayoutChanged}
          resizeTargetMinimumSize={{ coarse: 28, fine: 12 }}
        >
          {workspacePanel === "inbox" && (
            <>
              <Panel id="list" defaultSize="22%" minSize="15%" maxSize="40%" className="min-w-0">
                {renderListPanel(false)}
              </Panel>
              <ResizeHandle />
            </>
          )}

          <Panel
            id="main"
            defaultSize={workspacePanel === "inbox" ? "38%" : "60%"}
            minSize="30%"
            className="min-w-0"
          >
            {workspacePanel === "welcome" && (
              <AgentWelcome
                onOpenInbox={() => setWorkspacePanel("inbox")}
                onOpenCalendar={() => setWorkspacePanel("calendar")}
              />
            )}
            {workspacePanel === "brief" && (
              <DailyBriefPanel
                userEmail={userEmail}
                provider={provider}
                invalidationKey={briefInvalidationKey}
                onAction={handleSuggestedAction}
                onOpenSettings={() => {
                  void refreshAiKeysStatus();
                  setSettingsOpen(true);
                }}
              />
            )}
            {workspacePanel === "inbox" && renderThreadPanel()}
            {workspacePanel === "calendar" && renderCalendarContent()}
          </Panel>

          <ResizeHandle />
          <Panel id="sidebar" defaultSize="40%" minSize="28%" maxSize="50%" className="min-w-0">
            <AgentChatPanel
              contacts={agentContacts}
              openThread={agentOpenThread}
              shouldBridgeInviteToInbox={(input) =>
                shouldBridgeInviteToInbox(input, selectedThread)
              }
              workspaceActive={
                workspacePanel === "inbox" || workspacePanel === "calendar"
                  ? workspacePanel
                  : null
              }
              onOpenInbox={() => setWorkspacePanel("inbox")}
              onOpenCalendar={() => setWorkspacePanel("calendar")}
              onEditTool={(toolName, input) => {
                if (toolName === "send_email" || toolName === "schedule_send") {
                  const body = typeof input.body === "string" ? input.body : "";
                  setComposerDraft(body);
                  setComposerOpen(true);
                  setWorkspacePanel("inbox");
                }
                if (toolName === "create_calendar_invite") {
                  openAgentMeetingPicker(input);
                }
              }}
              onToolApproved={(toolName, input) => {
                if (toolName === "send_email" || toolName === "schedule_send") {
                  const recipients = [
                    ...(Array.isArray(input.to)
                      ? input.to.filter((value): value is string => typeof value === "string")
                      : typeof input.to === "string"
                        ? [input.to]
                        : []),
                    ...(Array.isArray(input.cc)
                      ? input.cc.filter((value): value is string => typeof value === "string")
                      : []),
                    ...(Array.isArray(input.bcc)
                      ? input.bcc.filter((value): value is string => typeof value === "string")
                      : []),
                  ];
                  promptUnknownContacts(recipients);
                }
                if (toolName === "create_calendar_invite") {
                  const attendees = Array.isArray(input.attendees)
                    ? input.attendees.filter((value): value is string => typeof value === "string")
                    : [];
                  promptUnknownContacts(attendees);
                }
              }}
              onOpenSettings={() => {
                void refreshAiKeysStatus();
                setSettingsOpen(true);
              }}
            />
          </Panel>
        </Group>
        </div>

        <div className="flex h-full flex-col lg:hidden">
          {mobileTab === "brief" && (
            <DailyBriefPanel
              userEmail={userEmail}
              provider={provider}
              invalidationKey={briefInvalidationKey}
              onAction={handleSuggestedAction}
              onOpenSettings={() => {
                void refreshAiKeysStatus();
                setSettingsOpen(true);
              }}
            />
          )}
          {mobileTab === "inbox" && !mobileThreadOpen && renderListPanel(true)}
          {mobileTab === "inbox" && mobileThreadOpen && renderThreadPanel(() => setMobileThreadOpen(false))}
          {mobileTab === "calendar" && renderCalendarContent()}
          {mobileTab === "agent" && (
            <AgentChatPanel
              contacts={agentContacts}
              openThread={agentOpenThread}
              shouldBridgeInviteToInbox={(input) =>
                shouldBridgeInviteToInbox(input, selectedThread)
              }
              workspaceActive={
                workspacePanel === "inbox" || workspacePanel === "calendar"
                  ? workspacePanel
                  : null
              }
              onOpenInbox={() => {
                setWorkspacePanel("inbox");
                setMobileTab("inbox");
              }}
              onOpenCalendar={() => {
                setWorkspacePanel("calendar");
                setMobileTab("calendar");
              }}
              onEditTool={(toolName, input) => {
                if (toolName === "send_email" || toolName === "schedule_send") {
                  const body = typeof input.body === "string" ? input.body : "";
                  setComposerDraft(body);
                  setComposerOpen(true);
                  setWorkspacePanel("inbox");
                  setMobileTab("inbox");
                  setMobileThreadOpen(true);
                }
                if (toolName === "create_calendar_invite") {
                  setAvailabilityOpen(true);
                  setWorkspacePanel("inbox");
                  setMobileTab("inbox");
                  setMobileThreadOpen(true);
                }
              }}
              onToolApproved={(toolName, input) => {
                if (toolName === "send_email" || toolName === "schedule_send") {
                  const recipients = [
                    ...(Array.isArray(input.to)
                      ? input.to.filter((value): value is string => typeof value === "string")
                      : typeof input.to === "string"
                        ? [input.to]
                        : []),
                    ...(Array.isArray(input.cc)
                      ? input.cc.filter((value): value is string => typeof value === "string")
                      : []),
                    ...(Array.isArray(input.bcc)
                      ? input.bcc.filter((value): value is string => typeof value === "string")
                      : []),
                  ];
                  promptUnknownContacts(recipients);
                }
                if (toolName === "create_calendar_invite") {
                  const attendees = Array.isArray(input.attendees)
                    ? input.attendees.filter((value): value is string => typeof value === "string")
                    : [];
                  promptUnknownContacts(attendees);
                }
              }}
              onOpenSettings={() => {
                void refreshAiKeysStatus();
                setSettingsOpen(true);
              }}
            />
          )}
        </div>
        </div>

        <ActivityBar
          items={activities}
          open={activityOpen}
          onOpenChange={setActivityOpen}
          onDismiss={(id) => setActivities((prev) => prev.filter((a) => a.id !== id))}
          onCancel={(id) => {
            setActivities((prev) => {
              const item = prev.find((a) => a.id === id);
              if (item?.type === "snooze") {
                const match = item.id.match(/^snooze-(.+)-\d+$/);
                if (match) {
                  setSnoozed((s) => s.filter((x) => x.threadId !== match[1]));
                }
              }
              if (item?.type === "scheduled_send" && item.scheduledSendId) {
                void cancelSendApi(item.scheduledSendId).catch(() => undefined);
              }
              return prev.filter((a) => a.id !== id);
            });
          }}
        />

        <CommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          isMac={isMac}
          onAction={handleAction}
        />
        <ShortcutCheatsheet open={cheatsheetOpen} onOpenChange={setCheatsheetOpen} isMac={isMac} />
        <SnoozePicker
          open={snoozeOpen}
          onOpenChange={setSnoozeOpen}
          threadSubject={selectedThread?.subject}
          timezone={prefs.timezone}
          onSnooze={(until, label) => {
            if (multiSelectMode && selectedIds.size > 0) {
              selectedIds.forEach((id) => snoozeThread(id, until, label));
              setSelectedIds(new Set());
              setMultiSelectMode(false);
            } else if (selectedThreadId) {
              snoozeThread(selectedThreadId, until, label);
            }
          }}
        />
        <SendLaterPicker
          open={sendLaterOpen}
          onOpenChange={setSendLaterOpen}
          sendTimeSuggestion={sendTimeSuggestion}
          onSchedule={(at) => {
            void handleSendLater(sendLaterBody, at, sendLaterAttachmentIds);
            setSendLaterOpen(false);
            setSendLaterAttachmentIds([]);
          }}
        />
        <CustomSchedulePicker
          open={customScheduleOpen}
          onOpenChange={(open) => {
            setCustomScheduleOpen(open);
            if (!open) setRescheduleConflictEvent(null);
          }}
          durationMinutes={meetingDuration}
          title={
            rescheduleConflictEvent
              ? `Reschedule ${rescheduleConflictEvent.summary}`
              : "Custom meeting time"
          }
          onSelect={(slot) => {
            void handleCustomScheduleSubmit(slot);
          }}
        />
        <RescheduleExistingMeetingModal
          open={rescheduleConfirmOpen}
          onOpenChange={setRescheduleConfirmOpen}
          linkedEvent={selectedLinkedEvent}
          onConfirm={confirmRescheduleMeeting}
        />
        <ScheduleOverlapModal
          open={overlapModalOpen}
          onOpenChange={setOverlapModalOpen}
          conflictingEvent={overlapConflict}
          proposedStart={overlapProposedStart}
          onRescheduleConflict={() => {
            setOverlapModalOpen(false);
            if (!overlapConflict) return;

            const linkedThread = threadMeetings.find(
              (meeting) => meeting.eventId === overlapConflict.id
            );
            if (linkedThread) {
              setSelectedThreadId(linkedThread.threadId);
              setAvailabilityMode("reschedule");
              setAvailabilityOpen(true);
              return;
            }

            setRescheduleConflictEvent(overlapConflict);
            setCustomScheduleOpen(true);
          }}
          onPickAnotherTime={() => {
            setOverlapModalOpen(false);
            setCustomScheduleOpen(true);
          }}
        />
        <AddContactModal
          open={!!pendingContactEmail}
          email={pendingContactEmail ?? ""}
          onOpenChange={(open) => {
            if (!open) setPendingContactEmail(null);
          }}
          onAdd={() => {
            if (!pendingContactEmail) return;
            void addContactApi({ email: pendingContactEmail })
              .then(() => {
                setPendingContactEmail(null);
                void queryClient.invalidateQueries({ queryKey: inboxQueryKeys.contacts() });
              })
              .catch(() => setPendingContactEmail(null));
          }}
          onDismiss={() => setPendingContactEmail(null)}
          onNeverAsk={() => {
            if (!pendingContactEmail) return;
            const email = pendingContactEmail;
            void dismissContactApi(email)
              .then(() => setPendingContactEmail(null))
              .catch(() => setPendingContactEmail(null));
          }}
        />
        <SearchOverlay
          open={searchOpen}
          onOpenChange={setSearchOpen}
          onSelectThread={(threadId) => {
            setSelectedThreadId(threadId);
            const lane = classifications.find((c) => c.threadId === threadId)?.lane;
            if (lane && lane !== "done") {
              setActiveLane(lane);
            }
          }}
        />
        <AdvancedSearchOverlay
          open={advancedSearchOpen}
          onOpenChange={setAdvancedSearchOpen}
          onSelectThread={(threadId) => {
            setSelectedThreadId(threadId);
            const lane = classifications.find((c) => c.threadId === threadId)?.lane;
            if (lane && lane !== "done") {
              setActiveLane(lane);
            }
          }}
        />
        <UndoToast undo={undo} onDismiss={() => setUndo(null)} />
        <ExportTaskModal
          open={exportOpen}
          title={selectedThread?.subject ?? "Task from email"}
          description={selectedThread?.snippet ?? ""}
          loading={exportLoading}
          onClose={() => setExportOpen(false)}
          onExport={(title, description) => {
            if (!selectedThreadId) return;
            setExportLoading(true);
            void exportTaskApi({ threadId: selectedThreadId, title, description })
              .then((result) => {
                setExportOpen(false);
                showUndo(`Created Linear issue`, () => undefined);
                window.open(result.task.url, "_blank");
              })
              .catch((error) =>
                showUndo(error instanceof Error ? error.message : "Export failed", () => undefined)
              )
              .finally(() => setExportLoading(false));
          }}
        />
        {settingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold">Settings</h2>
                <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(false)}>
                  Close
                </Button>
              </div>
              <InboxSettingsPanel
                userEmail={userEmail}
                batchWindows={prefs.batchWindows}
                focusModeEnabled={prefs.focusModeEnabled}
                autoResponderTemplate={prefs.autoResponderTemplate}
                onToggleFocus={(enabled) => {
                  void patchPreferencesApi({ focusModeEnabled: enabled }).then(() =>
                    void queryClient.invalidateQueries({ queryKey: inboxQueryKeys.preferences() })
                  );
                }}
                onUpdateTemplate={(template) => {
                  void patchPreferencesApi({ autoResponderTemplate: template }).then(() =>
                    void queryClient.invalidateQueries({ queryKey: inboxQueryKeys.preferences() })
                  );
                }}
                linearToken={linearToken}
                linearTeamId={linearTeamId}
                onLinearTokenChange={setLinearToken}
                onLinearTeamIdChange={setLinearTeamId}
                onSaveLinear={() => {
                  void connectLinearApi(linearToken, linearTeamId).then(() =>
                    showUndo("Linear connected", () => undefined)
                  );
                }}
                aiKeysStatus={aiKeysStatus}
                onAiKeysStatusChange={setAiKeysStatus}
                googleContactsReturn={googleContactsReturn}
              />
            </div>
          </div>
        )}
        <MobileTabBar
          active={mobileTab}
          onChange={(tab) => {
            setMobileTab(tab);
            setMobileThreadOpen(false);
            if (tab === "brief") setWorkspacePanel("brief");
            if (tab === "inbox") setWorkspacePanel("inbox");
            if (tab === "calendar") setWorkspacePanel("calendar");
          }}
        />
        <MobileCommandFab modLabel={modLabel} onOpenPalette={() => setPaletteOpen(true)} />
      </div>
    </TooltipProvider>
  );
}
