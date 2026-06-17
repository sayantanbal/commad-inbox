import { describe, expect, it } from "bun:test";
import {
  buildInboxSearchParams,
  inboxUrlFromState,
  parseInboxSearchParams,
} from "@/lib/inbox/url-state";

describe("inbox url-state", () => {
  it("parses mailbox, lane, panel, thread, and contact", () => {
    const params = new URLSearchParams(
      "mailbox=sent&lane=schedule&panel=brief&thread=abc123&contact=judge@example.com"
    );
    expect(parseInboxSearchParams(params)).toEqual({
      mailbox: "sent",
      lane: "schedule",
      panel: "brief",
      thread: "abc123",
      contact: "judge@example.com",
    });
  });

  it("ignores invalid enum values", () => {
    const params = new URLSearchParams("mailbox=trash&lane=urgent&panel=agent");
    expect(parseInboxSearchParams(params)).toEqual({});
  });

  it("builds minimal query strings", () => {
    const query = buildInboxSearchParams({
      thread: "t1",
      mailbox: "inbox",
      lane: "reply",
      panel: null,
      contact: null,
    });
    expect(query.toString()).toBe("thread=t1");
  });

  it("round-trips non-default navigation state", () => {
    const state = {
      thread: "t9",
      mailbox: "snoozed" as const,
      lane: "fyi" as const,
      panel: "waiting" as const,
      contact: null,
    };
    const roundTrip = parseInboxSearchParams(buildInboxSearchParams(state));
    expect(roundTrip).toEqual({
      thread: "t9",
      mailbox: "snoozed",
      lane: "fyi",
      panel: "waiting",
    });
    expect(inboxUrlFromState(state)).toBe(
      "/inbox?mailbox=snoozed&lane=fyi&panel=waiting&thread=t9"
    );
  });
});
