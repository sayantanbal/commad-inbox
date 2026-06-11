import type { CalendarEvent, Classification, Thread } from "@/lib/types";

export type SerializedInboxData = {
  threads: Array<
    Omit<Thread, "timestamp" | "messages"> & {
      timestamp: string;
      messages: Array<
        Omit<Thread["messages"][number], "timestamp"> & {
          timestamp: string;
        }
      >;
    }
  >;
  classifications: Array<
    Omit<Classification, "classifiedAt" | "schedulingIntent"> & {
      classifiedAt: string;
      schedulingIntent: {
        proposedTimes: string[];
        attendees: string[];
        duration: number;
        confidence: number;
      } | null;
    }
  >;
  events: Array<
    Omit<CalendarEvent, "start" | "end"> & {
      start: string;
      end: string;
    }
  >;
};

export function serializeInboxData(input: {
  threads: Thread[];
  classifications: Classification[];
  events: CalendarEvent[];
}): SerializedInboxData {
  return {
    threads: input.threads.map((thread) => ({
      ...thread,
      timestamp: thread.timestamp.toISOString(),
      messages: thread.messages.map((message) => ({
        ...message,
        timestamp: message.timestamp.toISOString(),
      })),
    })),
    classifications: input.classifications.map((classification) => ({
      ...classification,
      classifiedAt: classification.classifiedAt.toISOString(),
      schedulingIntent: classification.schedulingIntent
        ? {
            ...classification.schedulingIntent,
            proposedTimes: classification.schedulingIntent.proposedTimes.map((time) =>
              time.toISOString()
            ),
          }
        : null,
    })),
    events: input.events.map((event) => ({
      ...event,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
    })),
  };
}

export function deserializeInboxData(data: SerializedInboxData): {
  threads: Thread[];
  classifications: Classification[];
  events: CalendarEvent[];
} {
  return {
    threads: data.threads.map((thread) => ({
      ...thread,
      timestamp: new Date(thread.timestamp),
      messages: thread.messages.map((message) => ({
        ...message,
        timestamp: new Date(message.timestamp),
      })),
    })),
    classifications: data.classifications.map((classification) => ({
      ...classification,
      classifiedAt: new Date(classification.classifiedAt),
      schedulingIntent: classification.schedulingIntent
        ? {
            ...classification.schedulingIntent,
            proposedTimes: classification.schedulingIntent.proposedTimes.map(
              (time) => new Date(time)
            ),
          }
        : null,
    })),
    events: data.events.map((event) => ({
      ...event,
      start: new Date(event.start),
      end: new Date(event.end),
    })),
  };
}
