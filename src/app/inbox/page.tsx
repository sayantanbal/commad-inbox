import { AuthMissingError } from "corsair/core";
import { redirect } from "next/navigation";
import { InboxSetupRequired } from "@/components/inbox/inbox-setup-required";
import { GmailApiDisabledError } from "@/lib/corsair/api-errors";
import {
  withDefaultClassifications,
  getClassificationsForUser,
} from "@/lib/corsair/classifications";
import { triggerInboxBackfill } from "@/lib/backfill/inbox-backfill";
import { isBackfillComplete } from "@/lib/users/backfill-status";
import { fetchEventsForTenant } from "@/lib/corsair/events";
import { fetchThreadsForTenant } from "@/lib/corsair/threads";
import { requireConnectedTenant } from "@/lib/corsair/tenant";
import { getSnoozesForUser } from "@/lib/inbox/snoozes";
import { getThreadMeetingsForUser } from "@/lib/inbox/thread-meetings";
import { serializeInboxData } from "@/lib/inbox-serialize";
import { InboxClient } from "./inbox-client";

function isAuthError(error: unknown): boolean {
  if (error instanceof AuthMissingError) return true;
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("auth-missing") ||
    message.includes("Authentication required") ||
    message.includes("Account not found") ||
    message.includes("401")
  );
}

export default async function InboxPage() {
  const { tenant, userId, userEmail } = await requireConnectedTenant();

  try {
    const [threads, storedClassifications, events, backfillComplete, snoozes, threadMeetings] =
      await Promise.all([
      fetchThreadsForTenant(tenant),
      getClassificationsForUser(userId),
      fetchEventsForTenant(tenant),
      isBackfillComplete(userId),
      getSnoozesForUser(userId),
      getThreadMeetingsForUser(userId),
    ]);

    if (!backfillComplete) {
      triggerInboxBackfill(userId);
    }

    const classifications = withDefaultClassifications(threads, storedClassifications);
    const data = serializeInboxData({ threads, classifications, events, threadMeetings });

    return (
      <InboxClient
        initialData={data}
        userId={userId}
        userEmail={userEmail}
        backfillComplete={backfillComplete}
        initialSnoozes={snoozes.map((snooze) => ({
          threadId: snooze.threadId,
          until: snooze.until.toISOString(),
        }))}
      />
    );
  } catch (error) {
    if (isAuthError(error)) {
      redirect("/onboarding/connect?reconnect=1");
    }
    if (error instanceof GmailApiDisabledError) {
      return (
        <InboxSetupRequired
          title="Enable the Gmail API"
          description="OAuth connected successfully, but your Google Cloud project does not have the Gmail API enabled yet. Enable it in the same project as your OAuth client, wait a minute, then reload the inbox."
          actionHref={
            error.activationUrl ??
            "https://console.cloud.google.com/apis/library/gmail.googleapis.com"
          }
          actionLabel="Enable Gmail API"
        />
      );
    }
    throw error;
  }
}
