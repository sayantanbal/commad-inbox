import { describe, expect, test } from "bun:test";
import {
  getClassifyThreadIdFromGmailWebhook,
  shouldClassifyGmailEvent,
  shouldHandleGmailMessageChanged,
} from "@/lib/webhooks/gmail-event-filter";

describe("gmail webhook classify pipeline", () => {
  test("routes messageChanged from gmail plugin to classification", () => {
    expect(shouldHandleGmailMessageChanged("gmail", "messageChanged")).toBe(true);
    expect(shouldHandleGmailMessageChanged("googlecalendar", "eventChanged")).toBe(false);
    expect(shouldHandleGmailMessageChanged("gmail", "watchExpired")).toBe(false);
  });

  test("extracts thread id for messageReceived events", () => {
    const body = { type: "messageReceived", message: { threadId: "thread-abc" } };
    expect(shouldClassifyGmailEvent(body)).toBe(true);
    expect(getClassifyThreadIdFromGmailWebhook(body)).toBe("thread-abc");
  });

  test("skips classification for deleted or incomplete events", () => {
    expect(shouldClassifyGmailEvent({ type: "messageDeleted" })).toBe(false);
    expect(getClassifyThreadIdFromGmailWebhook({ type: "messageDeleted" })).toBeNull();
    expect(
      getClassifyThreadIdFromGmailWebhook({ type: "messageReceived", message: {} })
    ).toBeNull();
  });

  test("end-to-end routing decision matches webhook handler branches", () => {
    const plugin = "gmail";
    const action = "messageChanged";
    const body = { type: "messageReceived", message: { threadId: "t-99" } };

    const shouldClassify =
      shouldHandleGmailMessageChanged(plugin, action) &&
      getClassifyThreadIdFromGmailWebhook(body) !== null;

    expect(shouldClassify).toBe(true);
    expect(getClassifyThreadIdFromGmailWebhook(body)).toBe("t-99");
  });
});
