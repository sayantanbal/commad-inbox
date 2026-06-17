"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import type { MailboxView, WorkspacePanel } from "@/components/inbox/primary-nav";
import {
  buildInboxSearchParams,
  parseInboxSearchParams,
  type InboxPanel,
  type InboxUrlState,
} from "@/lib/inbox/url-state";
import type { TriageLane } from "@/lib/types";

export interface InboxUrlSyncState {
  selectedThreadId: string | null;
  mailboxView: MailboxView;
  activeLane: TriageLane;
  workspacePanel: WorkspacePanel;
  commitmentsOpen: boolean;
  commitmentsView: "commitments" | "waiting";
}

export interface InboxUrlSyncHandlers {
  setSelectedThreadId: (id: string | null) => void;
  setMailboxView: (view: MailboxView) => void;
  setActiveLane: (lane: TriageLane) => void;
  setWorkspacePanel: (panel: WorkspacePanel) => void;
  setCommitmentsOpen: (open: boolean) => void;
  setCommitmentsView: (view: "commitments" | "waiting") => void;
  setMobileTab: (tab: "brief" | "inbox" | "calendar" | "agent") => void;
  setMobileThreadOpen: (open: boolean) => void;
}

function panelFromWorkspace(
  workspacePanel: WorkspacePanel,
  commitmentsOpen: boolean,
  commitmentsView: "commitments" | "waiting"
): InboxPanel | null {
  if (commitmentsOpen) return commitmentsView;
  if (workspacePanel === "brief") return "brief";
  if (workspacePanel === "calendar") return "calendar";
  if (workspacePanel === "inbox") return "inbox";
  return null;
}

function workspaceFromPanel(panel: InboxPanel | null): {
  workspacePanel: WorkspacePanel;
  commitmentsOpen: boolean;
  commitmentsView: "commitments" | "waiting";
} {
  switch (panel) {
    case "brief":
      return { workspacePanel: "brief", commitmentsOpen: false, commitmentsView: "commitments" };
    case "calendar":
      return { workspacePanel: "calendar", commitmentsOpen: false, commitmentsView: "commitments" };
    case "commitments":
      return { workspacePanel: "inbox", commitmentsOpen: true, commitmentsView: "commitments" };
    case "waiting":
      return { workspacePanel: "inbox", commitmentsOpen: true, commitmentsView: "waiting" };
    case "inbox":
      return { workspacePanel: "inbox", commitmentsOpen: false, commitmentsView: "commitments" };
    default:
      return { workspacePanel: "inbox", commitmentsOpen: false, commitmentsView: "commitments" };
  }
}

function stateToUrl(state: InboxUrlSyncState): InboxUrlState {
  return {
    thread: state.selectedThreadId,
    mailbox: state.mailboxView,
    lane: state.activeLane,
    panel: panelFromWorkspace(state.workspacePanel, state.commitmentsOpen, state.commitmentsView),
    contact: null,
  };
}

function urlEquals(a: URLSearchParams, b: URLSearchParams): boolean {
  return a.toString() === b.toString();
}

export function useInboxUrlSync(
  state: InboxUrlSyncState,
  handlers: InboxUrlSyncHandlers,
  threads: Array<{ id: string; participants: Array<{ email?: string; name?: string }> }>
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const appliedInitialRef = useRef(false);
  const skipNextSyncRef = useRef(false);

  const applyUrlToState = useCallback(
    (params: URLSearchParams) => {
      const parsed = parseInboxSearchParams(params);
      skipNextSyncRef.current = true;

      if (parsed.mailbox) handlers.setMailboxView(parsed.mailbox);
      if (parsed.lane) handlers.setActiveLane(parsed.lane);

      if (parsed.panel) {
        const mapped = workspaceFromPanel(parsed.panel);
        handlers.setWorkspacePanel(mapped.workspacePanel);
        handlers.setCommitmentsOpen(mapped.commitmentsOpen);
        handlers.setCommitmentsView(mapped.commitmentsView);
        if (mapped.workspacePanel === "brief") handlers.setMobileTab("brief");
        if (mapped.workspacePanel === "calendar") handlers.setMobileTab("calendar");
        if (mapped.workspacePanel === "inbox") handlers.setMobileTab("inbox");
      }

      if (parsed.thread) {
        handlers.setSelectedThreadId(parsed.thread);
        handlers.setMobileThreadOpen(true);
        handlers.setMobileTab("inbox");
        handlers.setWorkspacePanel("inbox");
      } else if (parsed.contact) {
        const email = parsed.contact.toLowerCase();
        const match = threads.find((thread) =>
          thread.participants.some(
            (participant) =>
              participant.email?.toLowerCase().includes(email) ||
              participant.name?.toLowerCase().includes(email)
          )
        );
        if (match) {
          handlers.setSelectedThreadId(match.id);
          handlers.setMobileThreadOpen(true);
          handlers.setMobileTab("inbox");
          handlers.setWorkspacePanel("inbox");
        }
      }
    },
    [handlers, threads]
  );

  useEffect(() => {
    if (appliedInitialRef.current) return;
    appliedInitialRef.current = true;
    applyUrlToState(searchParams);
  }, [applyUrlToState, searchParams]);

  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    if (pathname !== "/inbox") return;

    const next = buildInboxSearchParams(stateToUrl(state));
    const current = new URLSearchParams(searchParams.toString());
    if (urlEquals(next, current)) return;

    const href = next.toString() ? `/inbox?${next.toString()}` : "/inbox";
    router.replace(href, { scroll: false });
  }, [pathname, router, searchParams, state]);
}
