export type TriageLane = "reply" | "schedule" | "fyi" | "done";
export type Priority = "high" | "medium" | "low";

export interface Participant {
  name: string;
  email: string;
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
  body: string;
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
  key: string;
  mod?: boolean;
  shift?: boolean;
  context: ShortcutContext;
  action: string;
  description: string;
}
