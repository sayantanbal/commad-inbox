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
