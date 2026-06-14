"use client";

import { useEffect, useRef } from "react";
import Pusher from "pusher-js";
import type { InboxRealtimeEvent } from "@/lib/realtime/pusher";

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

export function useInboxRealtime(
  userId: string,
  onEvent: (event: InboxRealtimeEvent) => void,
  onPoll?: () => void
): void {
  const onEventRef = useRef(onEvent);
  const onPollRef = useRef(onPoll);

  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    onPollRef.current = onPoll;
  });

  useEffect(() => {
    let pusher: Pusher | null = null;

    if (PUSHER_KEY && PUSHER_CLUSTER) {
      pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
      const channel = pusher.subscribe(`inbox-${userId}`);
      const handler = (event: InboxRealtimeEvent) => onEventRef.current(event);
      channel.bind("classification-updated", handler);
      channel.bind("backfill-progress", handler);
      channel.bind("backfill-complete", handler);
      channel.bind("reembed-progress", handler);
      channel.bind("reembed-complete", handler);
      channel.bind("calendar-updated", handler);
      channel.bind("inbox-changed", handler);
    }

    const pollMs = PUSHER_KEY && PUSHER_CLUSTER ? 30_000 : 5_000;
    const poll = setInterval(() => {
      onPollRef.current?.();
    }, pollMs);

    return () => {
      clearInterval(poll);
      if (pusher) {
        pusher.unsubscribe(`inbox-${userId}`);
        pusher.disconnect();
      }
    };
  }, [userId]);
}
