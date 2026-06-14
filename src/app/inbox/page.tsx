export const dynamic = "force-dynamic";

import { AuthMissingError } from "corsair/core";
import { redirect } from "next/navigation";
import { InboxSetupRequired } from "@/components/inbox/inbox-setup-required";
import { GmailApiDisabledError } from "@/lib/corsair/api-errors";
import {
  needsClassificationBoost,
  triggerInboxBackfill,
  triggerInboxReclassify,
} from "@/lib/backfill/inbox-backfill";
import { isBackfillComplete } from "@/lib/users/backfill-status";
import { requireConnectedTenant } from "@/lib/corsair/tenant";
import { getSnoozesForUser } from "@/lib/inbox/snoozes";
import { loadInboxDataForUser } from "@/lib/inbox/load-inbox-data";
import { renewWatchesIfNeeded } from "@/lib/webhooks/renew-watches";
import { getOnboardingRedirectPath } from "@/lib/onboarding/status";
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

  const onboardingPath = await getOnboardingRedirectPath(userId);
  if (onboardingPath !== "/inbox") {
    redirect(onboardingPath);
  }

  void renewWatchesIfNeeded(userId).catch((error) => {
    console.error("[inbox] watch renewal failed", error);
  });

  try {
    const backfillComplete = await isBackfillComplete(userId);
    const { serialized, threads, classifications } = await loadInboxDataForUser(tenant, userId);
    const snoozes = await getSnoozesForUser(userId);

    if (!backfillComplete) {
      triggerInboxBackfill(userId);
    } else if (needsClassificationBoost(classifications.length, threads.length)) {
      triggerInboxReclassify(userId);
    }

    return (
      <InboxClient
        initialData={serialized}
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
