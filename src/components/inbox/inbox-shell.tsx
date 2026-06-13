"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Activity, Command, Keyboard, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Group, Panel, useDefaultLayout } from "react-resizable-panels";
import { ActivityBar } from "@/components/inbox/activity-bar";
import { AgentChatPanel } from "@/components/inbox/agent-chat-panel";
import { CalendarPanel } from "@/components/inbox/calendar-panel";
import { CommandPalette } from "@/components/inbox/command-palette";
import { ComposerPanel } from "@/components/inbox/composer-panel";
import { ShortcutCheatsheet } from "@/components/inbox/shortcut-cheatsheet";
import { SnoozePicker } from "@/components/inbox/snooze-picker";
import { ThreadList } from "@/components/inbox/thread-list";
import { ThreadView } from "@/components/inbox/thread-view";
import { UndoToast, type UndoState } from "@/components/inbox/undo-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResizeHandle } from "@/components/ui/resize-handle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ActivityItem } from "@/lib/activity";
import { computeFreeSlots } from "@/lib/calendar/free-slots";
import {
  archiveThreadApi,
  cancelMeetingApi,
  cancelSendApi,
  createMeetingApi,
  dispatchSendApi,
  generateDraftApi,
  queueSendApi,
  restoreThreadApi,
  snoozeThreadApi,
  unsnoozeThreadApi,
  updateMeetingApi,
} from "@/lib/inbox/client-api";
import { replyRecipients, resolveMeetingAttendees } from "@/lib/inbox/recipients";
import { summarizeRsvp } from "@/lib/inbox/rsvp";
import { getModLabel } from "@/lib/shortcuts";
import { SearchOverlay } from "@/components/inbox/search-overlay";
import { useInboxRealtime } from "@/hooks/use-inbox-realtime";
import { mergeClassifications } from "@/lib/inbox/merge-classifications";
import type { InboxRealtimeEvent } from "@/lib/realtime/pusher";
import type { CalendarEvent, Classification, Thread, ThreadMeeting, TriageLane } from "@/lib/types";

const ACTIVE_LANES: TriageLane[] = ["reply", "schedule", "fyi"];
const LAYOUT_ID = "command-inbox-v2";
const SIDEBAR_LAYOUT_ID = "command-inbox-sidebar-v1";
const LAYOUT_STORAGE_KEY = `react-resizable-panels:${LAYOUT_ID}:list:main:sidebar`;
const SIDEBAR_LAYOUT_STORAGE_KEY = `react-resizable-panels:${SIDEBAR_LAYOUT_ID}:agent:calendar`;
const DEFAULT_LAYOUT = { list: 22, main: 48, sidebar: 30 };
const DEFAULT_SIDEBAR_LAYOUT = { agent: 38, calendar: 62 };



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

function useIsMac() {
  const [isMac, setIsMac] = useState(true);
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);
  return isMac;
}

interface InboxShellProps {
  threads: Thread[];
  classifications: Classification[];
  events: CalendarEvent[];
  threadMeetings: ThreadMeeting[];
  userId: string;
  userEmail: string;
  backfillComplete: boolean;
  initialSnoozes: Array<{ threadId: string; until: Date }>;
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
  threads,
  classifications: initialClassifications,
  events: initialEvents,
  threadMeetings: initialThreadMeetings,
  userId,
  userEmail,
  backfillComplete,
  initialSnoozes,
}: InboxShellProps) {
  const router = useRouter();
  const isMac = useIsMac();
  const modLabel = getModLabel(isMac);
  const startingLane = initialLane(initialClassifications);

  const { defaultLayout: savedLayout, onLayoutChanged } = useDefaultLayout({
    id: LAYOUT_ID,
    panelIds: ["list", "main", "sidebar"],
  });

  const { defaultLayout: savedSidebarLayout, onLayoutChanged: onSidebarLayoutChanged } =
    useDefaultLayout({
      id: SIDEBAR_LAYOUT_ID,
      panelIds: ["agent", "calendar"],
    });

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
    initialThreadId(threads, initialClassifications, startingLane)
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
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [undo, setUndo] = useState<UndoState | null>(null);

  const snoozedIds = useMemo(() => new Set(snoozed.map((s) => s.threadId)), [snoozed]);

  const classificationMap = useMemo(
    () => new Map(classifications.map((c) => [c.threadId, c])),
    [classifications]
  );

  const laneThreads = useMemo(
    () =>
      threads.filter((t) => {
        if (snoozedIds.has(t.id)) return false;
        return classificationMap.get(t.id)?.lane === activeLane;
      }),
    [threads, classificationMap, activeLane, snoozedIds]
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

  const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null;
  const selectedClassification = selectedThreadId ? classificationMap.get(selectedThreadId) : undefined;

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
    setAvailabilityOpen(false);
  }, [selectedThreadId]);



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
    }
  }, [backfillComplete]);

  const handleRealtimeEvent = useCallback((event: InboxRealtimeEvent) => {
    if (event.type === "classification-updated") {
      setClassifications((prev) => mergeClassifications(prev, event.classification));
    }
    if (event.type === "backfill-progress") {
      const pct = event.total > 0 ? Math.round((event.completed / event.total) * 100) : 0;
      setActivities((prev) =>
        prev.map((a) =>
          a.id === "backfill"
            ? {
                ...a,
                detail: `Classifying threads… ${event.completed}/${event.total}`,
                progress: pct,
              }
            : a
        )
      );
    }
    if (event.type === "backfill-complete") {
      setActivities((prev) => prev.filter((a) => a.id !== "backfill"));
      router.refresh();
    }
  }, [router]);

  const pollInbox = useCallback(() => {
    router.refresh();
  }, [router]);

  useInboxRealtime(userId, handleRealtimeEvent, pollInbox);

  useHotkeys(
    "/",
    (e) => {
      e.preventDefault();
      setSearchOpen(true);
    },
    { enableOnFormTags: false }
  );

  const showUndo = useCallback((message: string, onUndo: () => void) => {
    setUndo({ message, onUndo });
  }, []);

  const addActivity = useCallback((item: ActivityItem) => {
    setActivities((prev) => [...prev, item]);
  }, []);

  const archiveThread = useCallback(
    (threadId: string) => {
      const thread = threads.find((t) => t.id === threadId);
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
    [threads, laneThreads, selectedThreadId, showUndo, classificationMap]
  );

  const snoozeThread = useCallback(
    (threadId: string, until: Date, label: string) => {
      const thread = threads.find((t) => t.id === threadId);
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
    [threads, laneThreads, selectedThreadId, showUndo, addActivity]
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
      .then((result) => setComposerDraft(result.draftHtml))
      .catch(() => {
        showUndo("AI draft unavailable — write your reply manually", () => undefined);
      })
      .finally(() => setDraftLoading(false));
  }, [selectedThreadId, showUndo]);

  const openScheduleMeeting = useCallback(() => {
    if (!selectedThreadId) return;
    setAvailabilityMode(threadMeetingsMap.has(selectedThreadId) ? "reschedule" : "create");
    setAvailabilityOpen(true);
  }, [selectedThreadId, threadMeetingsMap]);

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
          setCheatsheetOpen(true);
          break;
        case "select":
          setMultiSelectMode((v) => !v);
          setSelectedIds(new Set());
          break;
        case "search":
          setPaletteOpen(true);
          break;
        default:
          break;
      }
    },
    [archiveThread, navigateThread, openScheduleMeeting, openSnooze, openReplyComposer, selectedThreadId]
  );

  useHotkeys("j", () => handleAction("nextThread"), { enabled: !composerOpen }, [handleAction, composerOpen]);
  useHotkeys("k", () => handleAction("prevThread"), { enabled: !composerOpen }, [handleAction, composerOpen]);
  useHotkeys("e", () => handleAction("archive"), { enabled: !!selectedThreadId && !composerOpen }, [
    handleAction,
    selectedThreadId,
    composerOpen,
  ]);
  useHotkeys("r", () => handleAction("reply"), { enabled: !!selectedThreadId && !composerOpen }, [
    handleAction,
    selectedThreadId,
    composerOpen,
  ]);
  useHotkeys("m", () => handleAction("meeting"), { enabled: !!selectedThreadId && !composerOpen }, [
    handleAction,
    selectedThreadId,
    composerOpen,
  ]);
  useHotkeys("s", () => handleAction("snooze"), { enabled: !!selectedThreadId && !composerOpen }, [
    handleAction,
    selectedThreadId,
    composerOpen,
  ]);
  useHotkeys("x", () => handleAction("select"), { enabled: !composerOpen }, [handleAction, composerOpen]);
  useHotkeys("mod+k", (e) => {
    e.preventDefault();
    setPaletteOpen(true);
  });
  useHotkeys("shift+/", () => setCheatsheetOpen(true));
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
    selectedLinkedMeeting?.durationMinutes ??
    selectedClassification?.schedulingIntent?.duration ??
    30;

  const freeSlots = useMemo(() => {
    const eventsForSlots =
      selectedLinkedMeeting && availabilityMode === "reschedule"
        ? calendarEvents.filter((event) => event.id !== selectedLinkedMeeting.eventId)
        : calendarEvents;
    return computeFreeSlots(eventsForSlots, meetingDuration);
  }, [calendarEvents, meetingDuration, selectedLinkedMeeting, availabilityMode]);

  const handleMeetingSlot = useCallback(
    async (slot: Date) => {
      if (!selectedThreadId || !selectedThread) return;

      const isReschedule = availabilityMode === "reschedule" && !!selectedLinkedMeeting;
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
      laneThreads,
      meetingAttendees,
      meetingDuration,
      selectedClassification,
      selectedLinkedMeeting,
      selectedThread,
      selectedThreadId,
      showUndo,
      userEmail,
    ]
  );

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

  const handleComposerSend = useCallback(
    async (bodyHtml: string) => {
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
      } catch (error) {
        showUndo(error instanceof Error ? error.message : "Send failed", () => undefined);
      }
    },
    [selectedThread, userEmail, showUndo]
  );

  const laneCounts = useMemo(() => {
    const counts: Record<TriageLane, number> = { reply: 0, schedule: 0, fyi: 0, done: 0 };
    classifications.forEach((c) => {
      if (!snoozedIds.has(c.threadId)) counts[c.lane]++;
    });
    return counts;
  }, [classifications, snoozedIds]);

  const handleSendLater = useCallback(
    async (bodyHtml: string) => {
      if (!selectedThread || !bodyHtml.trim()) return;

      const sendAt = new Date(Date.now() + 3_600_000);
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
        });

        addActivity({
          id: activityId,
          type: "scheduled_send",
          label: `Send later: ${selectedThread.subject.slice(0, 30)}…`,
          detail: format(sendAt, "h:mm a · MMM d"),
          at: sendAt,
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

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-semibold tracking-tight hover:opacity-80">
              Command<span className="text-primary">Inbox</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden text-muted-foreground/70 md:inline">
              Drag panel edges to resize
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-[10px]"
              onClick={() => setActivityOpen((v) => !v)}
            >
              <Activity className="h-3.5 w-3.5" />
              Activity
              {activities.length > 0 && (
                <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                  {activities.length}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-[10px]"
              onClick={() => setPaletteOpen(true)}
            >
              <Command className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Commands</span>
              <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[9px]">
                {modLabel}K
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-[10px]"
              onClick={() => setCheatsheetOpen(true)}
            >
              <Keyboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Shortcuts</span>
              <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[9px]">
                ⇧/
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden h-7 text-[10px] sm:inline-flex"
              onClick={() => {
                localStorage.removeItem(LAYOUT_STORAGE_KEY);
                localStorage.removeItem(SIDEBAR_LAYOUT_STORAGE_KEY);
                window.location.reload();
              }}
            >
              Reset layout
            </Button>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-hidden">
        <Group
          orientation="horizontal"
          className="absolute inset-0 h-full w-full"
          defaultLayout={savedLayout ?? DEFAULT_LAYOUT}
          onLayoutChanged={onLayoutChanged}
          resizeTargetMinimumSize={{ coarse: 28, fine: 12 }}
        >
          {/* Left: lanes + thread list */}
          <Panel id="list" defaultSize="22%" minSize="15%" maxSize="40%" className="min-w-0">
            <aside className="flex h-full flex-col overflow-hidden">
              <div className="flex border-b border-border">
                {ACTIVE_LANES.map((lane) => (
                  <button
                    key={lane}
                    type="button"
                    onClick={() => setActiveLane(lane)}
                    className={`flex-1 px-2 py-2.5 text-xs font-medium transition-colors ${
                      activeLane === lane
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {laneLabels[lane]}
                    <span className="ml-1 text-muted-foreground">({laneCounts[lane]})</span>
                  </button>
                ))}
              </div>

              <div className="border-b border-border px-3 py-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={threadSearch}
                    onChange={(e) => setThreadSearch(e.target.value)}
                    placeholder="Filter threads…"
                    className="h-8 border-border/60 bg-secondary/30 pl-8 text-xs"
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
                <ThreadList
                  lane={activeLane}
                  threads={filteredLaneThreads}
                  classifications={classificationMap}
                  threadMeetings={threadMeetingsMap}
                  rsvpByThread={rsvpByThread}
                  selectedThreadId={selectedThreadId}
                  multiSelectMode={multiSelectMode}
                  selectedIds={selectedIds}
                  onSelectThread={setSelectedThreadId}
                  onToggleSelect={(id) => {
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    });
                  }}
                />
              </ScrollArea>
            </aside>
          </Panel>

          <ResizeHandle />

          {/* Center: thread view + composer */}
          <Panel id="main" defaultSize="48%" minSize="30%" className="min-w-0">
            <main className="flex h-full min-w-0 flex-col overflow-hidden">
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <ThreadView
                  thread={selectedThread}
                  modLabel={modLabel}
                  linkedMeeting={selectedLinkedMeeting}
                  linkedEvent={selectedLinkedEvent}
                  rsvpSummary={selectedRsvpSummary}
                  availabilityOpen={availabilityOpen}
                  availabilityMode={availabilityMode}
                  schedulingIntent={selectedClassification?.schedulingIntent ?? null}
                  freeSlots={freeSlots}
                  meetingAttendees={meetingAttendees}
                  onReply={openReplyComposer}
                  onArchive={() => selectedThreadId && archiveThread(selectedThreadId)}
                  onSchedule={openScheduleMeeting}
                  onSnooze={openSnooze}
                  onCloseAvailability={() => setAvailabilityOpen(false)}
                  onSelectSlot={(slot) => {
                    void handleMeetingSlot(slot);
                  }}
                  onRescheduleMeeting={() => {
                    setAvailabilityMode("reschedule");
                    setAvailabilityOpen(true);
                  }}
                  onCancelMeeting={() => {
                    void handleCancelMeeting();
                  }}
                />
              </div>
              <ComposerPanel
                open={composerOpen}
                subject={selectedThread?.subject ?? ""}
                modLabel={modLabel}
                initialContent={composerDraft}
                loading={draftLoading}
                onClose={closeComposer}
                onSend={handleComposerSend}
                onToneChange={(tone) => {
                  if (!selectedThreadId) return;
                  setDraftLoading(true);
                  void generateDraftApi(selectedThreadId, tone)
                    .then((result) => setComposerDraft(result.draftHtml))
                    .catch(() => undefined)
                    .finally(() => setDraftLoading(false));
                }}
                onSendLater={handleSendLater}
              />
            </main>
          </Panel>

          <ResizeHandle />

          {/* Right: resizable agent + calendar */}
          <Panel id="sidebar" defaultSize="30%" minSize="20%" maxSize="45%" className="min-w-0">
            <Group
              orientation="vertical"
              id={SIDEBAR_LAYOUT_ID}
              className="h-full"
              defaultLayout={savedSidebarLayout ?? DEFAULT_SIDEBAR_LAYOUT}
              onLayoutChanged={onSidebarLayoutChanged}
              resizeTargetMinimumSize={{ coarse: 28, fine: 12 }}
            >
              <Panel id="agent" defaultSize="38%" minSize="12%" maxSize="75%" className="min-h-0">
                <AgentChatPanel />
              </Panel>
              <ResizeHandle orientation="vertical" />
              <Panel id="calendar" defaultSize="62%" minSize="28%" className="min-h-0">
                <CalendarPanel
                  events={calendarEvents}
                  searchQuery={calendarSearch}
                  onSearchChange={setCalendarSearch}
                  onDefrag={() =>
                    showUndo("Defrag view coming soon", () => {
                      /* noop */
                    })
                  }
                />
              </Panel>
            </Group>
          </Panel>
        </Group>
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
        <UndoToast undo={undo} onDismiss={() => setUndo(null)} />
      </div>
    </TooltipProvider>
  );
}
