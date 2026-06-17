import "server-only";

import {
  addDays,
  format,
  getDay,
  getHours,
  setHours,
  setMinutes,
  startOfDay,
} from "date-fns";
import type { Message } from "@/lib/types";
import type { SendTimeSuggestion } from "@/lib/schemas/domain";

function isWeekday(date: Date): boolean {
  const day = getDay(date);
  return day >= 1 && day <= 5;
}

function nextBusinessMorning(from: Date): Date {
  let d = addDays(startOfDay(from), 1);
  while (!isWeekday(d)) d = addDays(d, 1);
  return setMinutes(setHours(d, 9), 0);
}

export function computeReplyHistogram(messages: Message[], userEmail: string): Map<number, number> {
  const histogram = new Map<number, number>();
  const sorted = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const userSentPrev = prev.from.email.toLowerCase() === userEmail.toLowerCase();
    const counterpartyReplied = curr.from.email.toLowerCase() !== userEmail.toLowerCase();
    if (userSentPrev && counterpartyReplied) {
      const hour = getHours(curr.timestamp);
      histogram.set(hour, (histogram.get(hour) ?? 0) + 1);
    }
  }
  return histogram;
}

export function suggestSendTime(messages: Message[], userEmail: string): SendTimeSuggestion {
  const exchanges = messages.filter(
    (m) => m.from.email.toLowerCase() !== userEmail.toLowerCase()
  ).length;

  if (exchanges < 5) {
    const fallback = nextBusinessMorning(new Date());
    return {
      suggestedAt: fallback.toISOString(),
      reason: "Not enough history — suggesting next business morning at 9am.",
      confidence: "low",
    };
  }

  const histogram = computeReplyHistogram(messages, userEmail);
  let bestHour = 10;
  let bestCount = 0;
  for (const [hour, count] of histogram) {
    if (count > bestCount) {
      bestCount = count;
      bestHour = hour;
    }
  }

  let suggested = setMinutes(setHours(new Date(), bestHour), 0);
  if (suggested <= new Date()) suggested = addDays(suggested, 1);
  while (!isWeekday(suggested)) suggested = addDays(suggested, 1);

  const dayName = format(suggested, "EEEE");
  return {
    suggestedAt: suggested.toISOString(),
    reason: `They often reply around ${bestHour}:00 — send the evening before (${dayName}).`,
    confidence: bestCount >= 3 ? "high" : "medium",
  };
}
