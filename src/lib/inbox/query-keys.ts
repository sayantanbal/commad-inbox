export const inboxQueryKeys = {
  all: ["inbox"] as const,
  sync: () => [...inboxQueryKeys.all, "sync"] as const,
  calendarEvents: (month: string) => [...inboxQueryKeys.all, "events", month] as const,
  preferences: () => [...inboxQueryKeys.all, "preferences"] as const,
  commitments: (threadId?: string) =>
    threadId
      ? ([...inboxQueryKeys.all, "commitments", threadId] as const)
      : ([...inboxQueryKeys.all, "commitments"] as const),
  sendTime: (email: string) => [...inboxQueryKeys.all, "send-time", email] as const,
  snippets: () => [...inboxQueryKeys.all, "snippets"] as const,
  contacts: () => [...inboxQueryKeys.all, "contacts"] as const,
  mailbox: (view: string) => [...inboxQueryKeys.all, "mailbox", view] as const,
  freeBusy: (emails: string[], start: string, end: string) =>
    [...inboxQueryKeys.all, "free-busy", emails.join(","), start, end] as const,
};
