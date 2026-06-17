"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { InboxShellSkeleton } from "@/components/inbox/inbox-shell-skeleton";
import { deserializeInboxData, type SerializedInboxData } from "@/lib/inbox-serialize";
import type { InboxIndexStatus } from "@/lib/backfill/inbox-index-format";

const InboxShell = dynamic(
  () => import("@/components/inbox/inbox-shell").then((m) => m.InboxShell),
  {
    ssr: false,
    loading: () => (
      <InboxShellSkeleton message="Preparing your workspace…" />
    ),
  }
);

interface InboxClientProps {
  initialData: SerializedInboxData;
  userId: string;
  userEmail: string;
  backfillComplete: boolean;
  indexStatus: InboxIndexStatus;
  initialSnoozes: Array<{ threadId: string; until: string }>;
  initialOpenSettings?: string | null;
  googleContactsReturn?: string | null;
}

export function InboxClient({
  initialData,
  userId,
  userEmail,
  backfillComplete,
  indexStatus,
  initialSnoozes,
  initialOpenSettings,
  googleContactsReturn,
}: InboxClientProps) {
  const data = deserializeInboxData(initialData);
  return (
    <Suspense fallback={<InboxShellSkeleton message="Preparing your workspace…" />}>
      <InboxShell
        threads={data.threads}
        classifications={data.classifications}
        events={data.events}
        threadMeetings={data.threadMeetings}
        userId={userId}
        userEmail={userEmail}
        backfillComplete={backfillComplete}
        indexStatus={indexStatus}
        initialSnoozes={initialSnoozes.map((snooze) => ({
          threadId: snooze.threadId,
          until: new Date(snooze.until),
        }))}
        initialOpenSettings={initialOpenSettings}
        googleContactsReturn={googleContactsReturn}
      />
    </Suspense>
  );
}
