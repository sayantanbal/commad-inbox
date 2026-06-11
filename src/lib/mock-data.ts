import type { CalendarEvent, Classification, Thread } from "./types";

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);
const daysFromNow = (d: number, hour = 10) => {
  const date = new Date(now);
  date.setDate(date.getDate() + d);
  date.setHours(hour, 0, 0, 0);
  return date;
};

export const mockThreads: Thread[] = [
  {
    id: "thread-1",
    subject: "Q2 strategy sync — does Tuesday 2pm work?",
    snippet: "Hi — wanted to lock in our Q2 planning session. I'm free Tuesday 2–4pm or Thursday morning...",
    timestamp: hoursAgo(2),
    unread: true,
    labels: ["INBOX"],
    participants: [
      { name: "Sarah Chen", email: "sarah@acmecorp.com" },
      { name: "You", email: "you@commandinbox.dev" },
    ],
    messages: [
      {
        id: "msg-1",
        from: { name: "Sarah Chen", email: "sarah@acmecorp.com" },
        to: [{ name: "You", email: "you@commandinbox.dev" }],
        body: "Hi — wanted to lock in our Q2 planning session. I'm free Tuesday 2–4pm or Thursday morning if that works better for you. Let me know!",
        timestamp: hoursAgo(2),
        attachments: [],
      },
    ],
  },
  {
    id: "thread-2",
    subject: "Re: Contract review follow-up",
    snippet: "Thanks for sending the revised terms. I've reviewed section 4 and have a few questions...",
    timestamp: hoursAgo(5),
    unread: true,
    labels: ["INBOX"],
    participants: [
      { name: "Marcus Webb", email: "marcus@legalpartners.io" },
      { name: "You", email: "you@commandinbox.dev" },
    ],
    messages: [
      {
        id: "msg-2",
        from: { name: "Marcus Webb", email: "marcus@legalpartners.io" },
        to: [{ name: "You", email: "you@commandinbox.dev" }],
        body: "Thanks for sending the revised terms. I've reviewed section 4 and have a few questions about the liability cap. Can we hop on a quick call this week?",
        timestamp: hoursAgo(5),
        attachments: [{ id: "att-1", filename: "contract-v3.pdf", mimeType: "application/pdf", size: 245000 }],
      },
    ],
  },
  {
    id: "thread-3",
    subject: "Coffee chat next week?",
    snippet: "Hey! Would love to catch up — any time Wed or Fri afternoon works for me.",
    timestamp: hoursAgo(8),
    unread: false,
    labels: ["INBOX"],
    participants: [
      { name: "Alex Rivera", email: "alex@startup.co" },
      { name: "You", email: "you@commandinbox.dev" },
    ],
    messages: [
      {
        id: "msg-3",
        from: { name: "Alex Rivera", email: "alex@startup.co" },
        to: [{ name: "You", email: "you@commandinbox.dev" }],
        body: "Hey! Would love to catch up — any time Wed or Fri afternoon works for me. No agenda, just want to hear how the product launch went.",
        timestamp: hoursAgo(8),
        attachments: [],
      },
    ],
  },
  {
    id: "thread-4",
    subject: "Your weekly digest from Product Hunt",
    snippet: "Top launches this week: AI scheduling tools, inbox assistants, and more...",
    timestamp: hoursAgo(24),
    unread: false,
    labels: ["INBOX", "NEWSLETTER"],
    participants: [{ name: "Product Hunt", email: "digest@producthunt.com" }],
    messages: [
      {
        id: "msg-4",
        from: { name: "Product Hunt", email: "digest@producthunt.com" },
        to: [{ name: "You", email: "you@commandinbox.dev" }],
        body: "Top launches this week: AI scheduling tools, inbox assistants, and more. See what's trending in productivity.",
        timestamp: hoursAgo(24),
        attachments: [],
      },
    ],
  },
  {
    id: "thread-5",
    subject: "Invoice #1042 — payment received",
    snippet: "Thank you! We've received your payment for invoice #1042.",
    timestamp: hoursAgo(48),
    unread: false,
    labels: ["INBOX"],
    participants: [{ name: "Stripe", email: "receipts@stripe.com" }],
    messages: [
      {
        id: "msg-5",
        from: { name: "Stripe", email: "receipts@stripe.com" },
        to: [{ name: "You", email: "you@commandinbox.dev" }],
        body: "Thank you! We've received your payment for invoice #1042. A receipt is attached for your records.",
        timestamp: hoursAgo(48),
        attachments: [],
      },
    ],
  },
];

export const mockClassifications: Classification[] = [
  {
    threadId: "thread-1",
    priority: "high",
    lane: "schedule",
    subject: "Q2 strategy sync — does Tuesday 2pm work?",
    sender: "Sarah Chen",
    snippet: "Hi — wanted to lock in our Q2 planning session...",
    schedulingIntent: {
      proposedTimes: [daysFromNow(2, 14), daysFromNow(4, 10)],
      attendees: ["sarah@acmecorp.com"],
      duration: 60,
      confidence: 0.92,
    },
    classifiedAt: hoursAgo(2),
  },
  {
    threadId: "thread-2",
    priority: "high",
    lane: "reply",
    subject: "Re: Contract review follow-up",
    sender: "Marcus Webb",
    snippet: "Thanks for sending the revised terms...",
    schedulingIntent: null,
    classifiedAt: hoursAgo(5),
  },
  {
    threadId: "thread-3",
    priority: "medium",
    lane: "schedule",
    subject: "Coffee chat next week?",
    sender: "Alex Rivera",
    snippet: "Hey! Would love to catch up...",
    schedulingIntent: {
      proposedTimes: [],
      attendees: ["alex@startup.co"],
      duration: 30,
      confidence: 0.35,
    },
    classifiedAt: hoursAgo(8),
  },
  {
    threadId: "thread-4",
    priority: "low",
    lane: "fyi",
    subject: "Your weekly digest from Product Hunt",
    sender: "Product Hunt",
    snippet: "Top launches this week...",
    schedulingIntent: null,
    classifiedAt: hoursAgo(24),
  },
  {
    threadId: "thread-5",
    priority: "low",
    lane: "done",
    subject: "Invoice #1042 — payment received",
    sender: "Stripe",
    snippet: "Thank you! We've received your payment...",
    schedulingIntent: null,
    classifiedAt: hoursAgo(48),
  },
];

export const mockEvents: CalendarEvent[] = [
  {
    id: "evt-1",
    summary: "Standup",
    start: daysFromNow(0, 9),
    end: daysFromNow(0, 9.5),
    attendees: [{ name: "Team", email: "team@commandinbox.dev" }],
    organizer: { name: "You", email: "you@commandinbox.dev" },
    status: "confirmed",
  },
  {
    id: "evt-2",
    summary: "Client onboarding call",
    start: daysFromNow(0, 14),
    end: daysFromNow(0, 15),
    attendees: [{ name: "Sarah Chen", email: "sarah@acmecorp.com" }],
    organizer: { name: "You", email: "you@commandinbox.dev" },
    status: "confirmed",
  },
  {
    id: "evt-3",
    summary: "Focus block",
    start: daysFromNow(1, 10),
    end: daysFromNow(1, 12),
    attendees: [],
    organizer: { name: "You", email: "you@commandinbox.dev" },
    status: "confirmed",
  },
  {
    id: "evt-4",
    summary: "Design review",
    start: daysFromNow(2, 11),
    end: daysFromNow(2, 12),
    attendees: [{ name: "Alex Rivera", email: "alex@startup.co" }],
    organizer: { name: "You", email: "you@commandinbox.dev" },
    status: "tentative",
  },
];

export function getClassification(threadId: string): Classification | undefined {
  return mockClassifications.find((c) => c.threadId === threadId);
}

export function getThreadsByLane(lane: string, includeDone = false): Thread[] {
  const activeLanes = includeDone ? ["reply", "schedule", "fyi", "done"] : ["reply", "schedule", "fyi"];
  if (!activeLanes.includes(lane)) return [];

  return mockThreads.filter((thread) => {
    const classification = getClassification(thread.id);
    return classification?.lane === lane;
  });
}
