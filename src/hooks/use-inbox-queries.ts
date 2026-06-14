"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useCallback } from "react";
import {
  fetchCalendarEventsApi,
  fetchCommitmentsApi,
  fetchContactsApi,
  fetchInboxSyncApi,
  fetchMailboxThreadsApi,
  fetchPreferencesApi,
  fetchSendTimeSuggestionApi,
  fetchSnippetsApi,
} from "@/lib/inbox/client-api";
import { inboxQueryKeys } from "@/lib/inbox/query-keys";
import { deserializeInboxData, deserializeThreads } from "@/lib/inbox-serialize";

export function useInboxPreferences() {
  return useQuery({
    queryKey: inboxQueryKeys.preferences(),
    queryFn: () => fetchPreferencesApi(),
    staleTime: 10 * 60_000,
  });
}

export function useSnippets() {
  return useQuery({
    queryKey: inboxQueryKeys.snippets(),
    queryFn: async () => {
      const data = await fetchSnippetsApi();
      return data.snippets;
    },
    staleTime: 10 * 60_000,
  });
}

export function useContacts() {
  return useQuery({
    queryKey: inboxQueryKeys.contacts(),
    queryFn: async () => {
      const data = await fetchContactsApi();
      return data.contacts;
    },
    staleTime: 5 * 60_000,
  });
}

export function useCalendarEvents(month: Date) {
  const monthKey = format(month, "yyyy-MM");
  return useQuery({
    queryKey: inboxQueryKeys.calendarEvents(monthKey),
    queryFn: async () => {
      const { events } = await fetchCalendarEventsApi(monthKey);
      return events.map((event) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
    },
    staleTime: 5 * 60_000,
  });
}

export function useThreadCommitments(threadId: string | null) {
  return useQuery({
    queryKey: inboxQueryKeys.commitments(threadId ?? undefined),
    queryFn: async () => {
      const data = await fetchCommitmentsApi();
      if (!threadId) return data.commitments;
      return data.commitments.filter((c) => c.threadId === threadId);
    },
    enabled: !!threadId,
    staleTime: 2 * 60_000,
  });
}

export function useSendTimeSuggestion(
  counterpartyEmail: string | null,
  threadId: string | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: inboxQueryKeys.sendTime(counterpartyEmail ?? ""),
    queryFn: async () => {
      if (!counterpartyEmail || !threadId) return null;
      const data = await fetchSendTimeSuggestionApi(counterpartyEmail, threadId);
      return data.suggestion;
    },
    enabled: enabled && !!counterpartyEmail && !!threadId,
    staleTime: 60 * 60_000,
  });
}

export function useMailboxThreads(view: "sent" | "inbox") {
  return useQuery({
    queryKey: inboxQueryKeys.mailbox(view),
    queryFn: async () => {
      if (view !== "sent") return [];
      const { threads } = await fetchMailboxThreadsApi("sent");
      return deserializeThreads(threads);
    },
    enabled: view === "sent",
    staleTime: 30_000,
  });
}

export function useInboxSyncInvalidation() {
  const queryClient = useQueryClient();

  const invalidateAll = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: inboxQueryKeys.all });
  }, [queryClient]);

  const invalidateSync = useCallback(async () => {
    const serialized = await fetchInboxSyncApi();
    const data = deserializeInboxData(serialized);
    queryClient.setQueryData(inboxQueryKeys.sync(), data);
    return data;
  }, [queryClient]);

  const invalidateCalendar = useCallback(
    (monthKey?: string) => {
      if (monthKey) {
        void queryClient.invalidateQueries({
          queryKey: inboxQueryKeys.calendarEvents(monthKey),
        });
      } else {
        void queryClient.invalidateQueries({
          queryKey: [...inboxQueryKeys.all, "events"],
        });
      }
    },
    [queryClient]
  );

  return { invalidateAll, invalidateSync, invalidateCalendar, queryClient };
}
