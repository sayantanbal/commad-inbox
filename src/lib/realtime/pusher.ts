import Pusher from "pusher";
import { env } from "@/lib/env";
import type { Classification } from "@/lib/types";

export type InboxRealtimeEvent =
  | {
      type: "classification-updated";
      threadId: string;
      classification: Classification;
    }
  | {
      type: "backfill-progress";
      completed: number;
      total: number;
    }
  | {
      type: "backfill-complete";
    }
  | {
      type: "reembed-progress";
      provider: "gemini" | "openai";
      completed: number;
      total: number;
    }
  | {
      type: "reembed-complete";
      provider: "gemini" | "openai";
      total: number;
      completed?: number;
    }
  | {
      type: "calendar-updated";
    }
  | {
      type: "inbox-changed";
      reason?: "gmail" | "poll";
    };

let server: Pusher | null = null;

function getPusherServer(): Pusher | null {
  if (!env.PUSHER_APP_ID || !env.PUSHER_KEY || !env.PUSHER_SECRET || !env.PUSHER_CLUSTER) {
    return null;
  }
  if (!server) {
    server = new Pusher({
      appId: env.PUSHER_APP_ID,
      key: env.PUSHER_KEY,
      secret: env.PUSHER_SECRET,
      cluster: env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }
  return server;
}

export function inboxChannelName(tenantId: string): string {
  return `inbox-${tenantId}`;
}

export async function broadcastInboxEvent(
  tenantId: string,
  event: InboxRealtimeEvent
): Promise<void> {
  const pusher = getPusherServer();
  if (!pusher) return;
  await pusher.trigger(inboxChannelName(tenantId), event.type, event);
}

export function isPusherConfigured(): boolean {
  return Boolean(
    env.PUSHER_APP_ID && env.PUSHER_KEY && env.PUSHER_SECRET && env.PUSHER_CLUSTER
  );
}
