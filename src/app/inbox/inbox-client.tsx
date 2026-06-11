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
}

export function InboxClient({ initialData }: InboxClientProps) {
  const data = deserializeInboxData(initialData);
  return (
    <InboxShell
      threads={data.threads}
      classifications={data.classifications}
      events={data.events}
    />
  );
}
