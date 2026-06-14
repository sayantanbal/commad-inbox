import "server-only";

import {
  withDefaultClassifications,
  getClassificationsForUser,
} from "@/lib/corsair/classifications";
import { fetchEventsForTenant } from "@/lib/corsair/events";
import { fetchThreadsForTenant } from "@/lib/corsair/threads";
import type { CorsairInstance } from "@/lib/corsair";
import { getSnoozesForUser } from "@/lib/inbox/snoozes";
import { getThreadMeetingsForUser } from "@/lib/inbox/thread-meetings";
import { serializeInboxData } from "@/lib/inbox-serialize";

export async function loadInboxDataForUser(
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  userId: string
) {
  const [threads, storedClassifications, events, snoozes, threadMeetings] = await Promise.all([
    fetchThreadsForTenant(tenant),
    getClassificationsForUser(userId),
    fetchEventsForTenant(tenant),
    getSnoozesForUser(userId),
    getThreadMeetingsForUser(userId),
  ]);

  const meetingThreadIds = new Set(threadMeetings.map((meeting) => meeting.threadId));
  const classifications = withDefaultClassifications(threads, storedClassifications, {
    meetingThreadIds,
  });

  return {
    threads,
    classifications,
    events,
    threadMeetings,
    snoozes,
    serialized: serializeInboxData({ threads, classifications, events, threadMeetings }),
  };
}
