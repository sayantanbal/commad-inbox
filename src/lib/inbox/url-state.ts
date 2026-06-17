import type { MailboxView } from "@/components/inbox/primary-nav";
import type { TriageLane } from "@/lib/types";

const MAILBOX_VALUES = ["inbox", "sent", "snoozed", "archive"] as const;
const LANE_VALUES = ["reply", "schedule", "fyi", "done"] as const;
const PANEL_VALUES = ["brief", "calendar", "inbox", "commitments", "waiting"] as const;

export type InboxPanel = (typeof PANEL_VALUES)[number];

export interface InboxUrlState {
  thread: string | null;
  mailbox: MailboxView;
  lane: TriageLane;
  panel: InboxPanel | null;
  contact: string | null;
}

export const DEFAULT_INBOX_URL_STATE: InboxUrlState = {
  thread: null,
  mailbox: "inbox",
  lane: "reply",
  panel: null,
  contact: null,
};

function parseMailbox(value: string | null): MailboxView | null {
  if (!value) return null;
  return MAILBOX_VALUES.includes(value as MailboxView) ? (value as MailboxView) : null;
}

function parseLane(value: string | null): TriageLane | null {
  if (!value) return null;
  return LANE_VALUES.includes(value as TriageLane) ? (value as TriageLane) : null;
}

function parsePanel(value: string | null): InboxPanel | null {
  if (!value) return null;
  return PANEL_VALUES.includes(value as InboxPanel) ? (value as InboxPanel) : null;
}

export function parseInboxSearchParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): Partial<InboxUrlState> {
  const get = (key: string): string | null => {
    if (params instanceof URLSearchParams) {
      return params.get(key);
    }
    const raw = params[key];
    if (Array.isArray(raw)) return raw[0] ?? null;
    return raw ?? null;
  };

  const mailbox = parseMailbox(get("mailbox"));
  const lane = parseLane(get("lane"));
  const panel = parsePanel(get("panel"));
  const thread = get("thread");
  const contact = get("contact");

  const result: Partial<InboxUrlState> = {};
  if (mailbox) result.mailbox = mailbox;
  if (lane) result.lane = lane;
  if (panel) result.panel = panel;
  if (thread) result.thread = thread;
  if (contact) result.contact = contact;
  return result;
}

export function buildInboxSearchParams(state: InboxUrlState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.mailbox !== "inbox") params.set("mailbox", state.mailbox);
  if (state.lane !== "reply") params.set("lane", state.lane);
  if (state.panel) params.set("panel", state.panel);
  if (state.thread) params.set("thread", state.thread);
  if (state.contact) params.set("contact", state.contact);

  return params;
}

export function inboxUrlFromState(state: InboxUrlState): string {
  const query = buildInboxSearchParams(state).toString();
  return query ? `/inbox?${query}` : "/inbox";
}
