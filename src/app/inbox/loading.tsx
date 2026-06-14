import { InboxShellSkeleton } from "@/components/inbox/inbox-shell-skeleton";

export default function InboxLoading() {
  return (
    <InboxShellSkeleton message="Loading your inbox from Gmail and Calendar…" />
  );
}
