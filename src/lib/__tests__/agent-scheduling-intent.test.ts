import { describe, expect, test } from "bun:test";
import { schedulingIntentFromAgentInvite } from "@/lib/inbox/agent-scheduling-intent";

describe("schedulingIntentFromAgentInvite", () => {
  test("maps agent invite input to scheduling intent", () => {
    const intent = schedulingIntentFromAgentInvite({
      start: "2026-06-19T09:00:00.000Z",
      durationMinutes: 45,
      attendees: ["friend@corsair.dev"],
    });

    expect(intent).not.toBeNull();
    expect(intent!.duration).toBe(45);
    expect(intent!.confidence).toBe(1);
    expect(intent!.attendees).toEqual(["friend@corsair.dev"]);
    expect(intent!.proposedTimes[0]?.toISOString()).toBe("2026-06-19T09:00:00.000Z");
  });

  test("returns null for invalid start", () => {
    expect(schedulingIntentFromAgentInvite({ start: "not-a-date" })).toBeNull();
  });
});

describe("shouldBridgeInviteToInbox", () => {
  test("bridges when invite guests match open thread", () => {
    const { shouldBridgeInviteToInbox } = require("@/lib/inbox/agent-scheduling-intent");
    expect(
      shouldBridgeInviteToInbox(
        { attendees: ["friend@corsair.dev"] },
        { participants: [{ email: "friend@corsair.dev" }] }
      )
    ).toBe(true);
  });

  test("does not bridge for unrelated calendar reminders", () => {
    const { shouldBridgeInviteToInbox } = require("@/lib/inbox/agent-scheduling-intent");
    expect(
      shouldBridgeInviteToInbox(
        { attendees: ["sayantan.bal.dev@gmail.com"] },
        { participants: [{ email: "other@example.com" }] }
      )
    ).toBe(false);
  });
});
