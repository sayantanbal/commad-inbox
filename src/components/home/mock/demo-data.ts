export const mockWaitingFor = [
  {
    id: "1",
    text: "Send revised contract by Friday",
    counterparty: "Priya Nair",
    due: "Fri",
    threadId: "t1",
  },
  {
    id: "2",
    text: "Loop in legal on redlines",
    counterparty: "Acme Corp",
    due: null,
    threadId: "t2",
  },
];

export const mockContacts = [
  { name: "Priya Nair", email: "priya@acme.io", warmth: "cold" as const, open: 1 },
  { name: "Dana Whitfield", email: "dana@studio.co", warmth: "active" as const, open: 0 },
  { name: "Marcus Lee", email: "marcus@client.dev", warmth: "warm" as const, open: 2 },
];

export const mockPreBrief = {
  attendee: "Priya Nair",
  tone: "Direct — waiting on your redlines.",
  threads: [
    { subject: "Contract review", snippet: "Can you send the updated PDF?" },
    { subject: "Kickoff recap", snippet: "Great sync yesterday…" },
  ],
  commitments: ["Send revised contract by Friday"],
};

export const mockSnippetResult =
  "<p>Hi Priya,</p><p>Just following up on my last note — wanted to check if you had a chance to review.</p>";

export const mockSendTime = {
  suggested: "Mon 4:00 PM",
  reason: "Priya usually replies Tue 10am — send the evening before.",
};

export const mockScheduleSlots = [
  { time: "Tue 10:00 AM", busy: false },
  { time: "Tue 11:00 AM", busy: true },
  { time: "Tue 2:30 PM", busy: false },
] as const;

export const mockScheduleThread = {
  subject: "Coffee next week?",
  sender: "Priya Nair",
  attendees: ["priya@acme.io"],
};

export const mockWorkingDaysText =
  "I work Mon–Thu 9:00–18:00 and Fri 9:00–13:00 (Asia/Kolkata). No meetings before 10:00. Lunch 13:00–14:00 blocked daily.";

export const schedulingDurations = [30, 45, 60] as const;

export type SchedulingDuration = (typeof schedulingDurations)[number];

export const mockCommitmentSetupSteps = [
  { step: 1, title: "Connect Gmail", detail: "One OAuth sign-in — we read threads, never send without you." },
  { step: 2, title: "AI extracts commitments", detail: "Every webhook pass finds promises made and owed." },
  { step: 3, title: "Press W anytime", detail: "Your Waiting For list stays one keystroke away." },
];

export const featureTabCopy: Record<
  string,
  { label: string; description: string; key?: string }
> = {
  schedule: {
    label: "Schedule",
    description: "Press M on a scheduling thread — pick a slot, send invite + confirmation draft.",
    key: "M",
  },
  commitments: {
    label: "Commitments",
    description: "Tracks what you promised and what you're waiting on — across every thread.",
    key: "W",
  },
  prebrief: {
    label: "Pre-Brief",
    description: "Surfaces tone, open threads, and context before every meeting.",
    key: "B",
  },
  people: {
    label: "People",
    description: "Scores relationship warmth from reply latency and open commitments.",
  },
  focus: {
    label: "Focus",
    description: "Batches notifications into check windows with a one-time auto-reply per sender.",
  },
  export: {
    label: "Export",
    description: "Turns thread action items into Linear issues in one keystroke.",
    key: "T",
  },
  snippets: {
    label: "Snippets",
    description: "Expands reusable templates when you type // in the composer.",
    key: "//",
  },
  sendtime: {
    label: "Send time",
    description: "Suggests optimal send times based on each contact's reply patterns.",
  },
};
