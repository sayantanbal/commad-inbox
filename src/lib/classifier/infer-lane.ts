import type { Priority, TriageLane } from "@/lib/types";

const SCHEDULE_PATTERN =
  /\b(calendar invite|scheduled|scheduling|meeting|meet\b|availability|free to chat|find a time|schedule a call|book a (time|slot)|sync up|catch up|coffee chat|zoom|google meet|teams meeting|when works|what time|propose(d)? times?)\b/i;

const FYI_PATTERN =
  /\b(newsletter|unsubscribe|notification|receipt|invoice|order shipped|promotional|marketing|digest|weekly roundup|for your information|just a heads up|no action needed|thought you'd like to know|automated message)\b/i;

const NO_REPLY_SENDER = /(^|[.@])no[-_.]?reply|donotreply|notifications?@/i;

export function inferLaneFromThread(input: {
  subject: string;
  snippet: string;
  sender?: string;
}): TriageLane {
  const text = `${input.subject} ${input.snippet}`;
  const sender = input.sender ?? "";

  if (SCHEDULE_PATTERN.test(text)) return "schedule";
  if (FYI_PATTERN.test(text) || NO_REPLY_SENDER.test(sender)) return "fyi";

  return "reply";
}

export function inferPriorityFromThread(input: {
  subject: string;
  snippet: string;
  lane: TriageLane;
}): Priority {
  const text = `${input.subject} ${input.snippet}`.toLowerCase();
  if (/\b(urgent|asap|immediate|deadline today|time sensitive)\b/.test(text)) return "high";
  if (input.lane === "fyi") return "low";
  return "medium";
}
