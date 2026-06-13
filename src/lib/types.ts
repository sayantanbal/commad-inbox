import type { DraftTone, Priority, TriageLane } from "@/lib/schemas/domain";

export type { DraftTone, Priority, TriageLane };

export interface Participant {
  name: string;
  email: string;
  responseStatus?: "needsAction" | "declined" | "tentative" | "accepted";
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface Message {
  id: string;
  from: Participant;
  to: Participant[];
  /** Plain text for AI, search, and snippets */
  body: string;
  /** Raw HTML from Gmail when available */
  bodyHtml?: string | null;
  timestamp: Date;
  attachments: Attachment[];
}

export interface Thread {
  id: string;
  subject: string;
  snippet: string;
  messages: Message[];
  participants: Participant[];
  labels: string[];
  timestamp: Date;
  unread: boolean;
}

export interface SchedulingIntent {
  proposedTimes: Date[];
  attendees: string[];
  duration: number;
  confidence: number;
}

export interface Classification {
  threadId: string;
  priority: Priority;
  lane: TriageLane;
  subject: string;
  sender: string;
  snippet: string;
  schedulingIntent: SchedulingIntent | null;
  classifiedAt: Date;
}

export interface ThreadMeeting {
  threadId: string;
  eventId: string;
  start: Date;
  durationMinutes: number;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  attendees: Participant[];
  location?: string;
  description?: string;
  organizer: Participant;
  status: "confirmed" | "tentative" | "cancelled";
}

export type ShortcutContext = "global" | "list" | "thread" | "composer";

export interface Shortcut {
  id: string;
  key: string;
  mod?: boolean;
  shift?: boolean;
  context: ShortcutContext;
  action: string;
  description: string;
  /** Shown in palette but not bound to a key */
  paletteOnly?: boolean;
  requiresThread?: boolean;
}
