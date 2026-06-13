"use client";

import dynamic from "next/dynamic";
import { deserializeInboxData, type SerializedInboxData } from "@/lib/inbox-serialize";

const InboxShell = dynamic(
  () => import("@/components/inbox/inbox-shell").then((m) => m.InboxShell),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading inbox…
      </div>
    ),
  }
);

interface InboxClientProps {
  initialData: SerializedInboxData;
  userId: string;
  userEmail: string;
  backfillComplete: boolean;
  initialSnoozes: Array<{ threadId: string; until: string }>;
}

export function InboxClient({
  initialData,
  userId,
  userEmail,
  backfillComplete,
  initialSnoozes,
}: InboxClientProps) {
  const data = deserializeInboxData(initialData);
  return (
    <InboxShell
      threads={data.threads}
      classifications={data.classifications}
      events={data.events}
      threadMeetings={data.threadMeetings}
      userId={userId}
      userEmail={userEmail}
      backfillComplete={backfillComplete}
      initialSnoozes={initialSnoozes.map((snooze) => ({
        threadId: snooze.threadId,
        until: new Date(snooze.until),
      }))}
    />
  );
}
