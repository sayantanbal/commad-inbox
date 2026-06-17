import type { Thread } from "@/lib/types";
import { threadDisplaySender } from "@/lib/inbox/palette-search";

const STORAGE_KEY = "command-inbox:recent-threads";
const MAX_RECENT = 5;

export interface RecentThread {
  id: string;
  subject: string;
  from: string;
  openedAt: number;
}

export function readRecentThreads(): RecentThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentThread[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => typeof item.id === "string" && typeof item.subject === "string")
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function recordRecentThread(thread: Pick<Thread, "id" | "subject" | "participants">): void {
  if (typeof window === "undefined") return;
  const entry: RecentThread = {
    id: thread.id,
    subject: thread.subject,
    from: threadDisplaySender(thread),
    openedAt: Date.now(),
  };
  const next = [entry, ...readRecentThreads().filter((item) => item.id !== thread.id)].slice(
    0,
    MAX_RECENT
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
