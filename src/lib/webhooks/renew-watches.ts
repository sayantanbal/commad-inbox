import "server-only";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { corsair } from "@/lib/corsair";
import { isTenantFullyConnected } from "@/lib/corsair/connection";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { env, getAppUrl } from "@/lib/env";
import { registerCalendarWatch, registerGmailWatch } from "@/lib/webhooks/watch-register";

/** Renew if missing or expiring within this window. */
const RENEW_BUFFER_MS = 24 * 60 * 60 * 1000;

export type WatchRenewResult = {
  tenantId: string;
  gmail: "renewed" | "skipped" | "failed";
  calendar: "renewed" | "skipped" | "failed";
  gmailExpiresAt?: string;
  calendarExpiresAt?: string;
  error?: string;
};

function needsRenewal(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() <= Date.now() + RENEW_BUFFER_MS;
}

async function saveWatchExpirations(
  tenantId: string,
  gmailExpiresAt: Date | null,
  calendarExpiresAt: Date | null
): Promise<void> {
  await db
    .update(users)
    .set({
      ...(gmailExpiresAt ? { gmailWatchExpiresAt: gmailExpiresAt } : {}),
      ...(calendarExpiresAt ? { calendarWatchExpiresAt: calendarExpiresAt } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, tenantId));
}

export async function renewGmailWatch(tenantId: string): Promise<Date | null> {
  if (!env.GMAIL_PUBSUB_TOPIC) {
    throw new Error("GMAIL_PUBSUB_TOPIC is not configured");
  }

  const tenant = corsair.withTenant(tenantId);
  await tenant.gmail.api.threads.list({ maxResults: 1 });
  const token = await tenant.gmail.keys.get_access_token();
  if (!token) throw new Error("Gmail access token unavailable");
  const { expiration } = await registerGmailWatch(token, env.GMAIL_PUBSUB_TOPIC);
  return expiration;
}

export async function renewCalendarWatch(tenantId: string): Promise<Date | null> {
  const appUrl = getAppUrl();
  const webhookUrl = `${appUrl}/api/webhooks/calendar?tenantId=${encodeURIComponent(tenantId)}`;

  const tenant = corsair.withTenant(tenantId);
  await tenant.googlecalendar.api.events.getMany({ maxResults: 1 });
  const token = await tenant.googlecalendar.keys.get_access_token();
  if (!token) throw new Error("Calendar access token unavailable");
  const { expiration } = await registerCalendarWatch(token, webhookUrl, randomUUID());
  return expiration;
}

export async function renewWatchesForTenant(
  tenantId: string,
  options?: { force?: boolean }
): Promise<WatchRenewResult> {
  const force = options?.force ?? false;

  if (!(await isTenantFullyConnected(tenantId))) {
    return { tenantId, gmail: "skipped", calendar: "skipped" };
  }

  const [user] = await db
    .select({
      gmailWatchExpiresAt: users.gmailWatchExpiresAt,
      calendarWatchExpiresAt: users.calendarWatchExpiresAt,
    })
    .from(users)
    .where(eq(users.id, tenantId))
    .limit(1);

  const renewGmail = force || needsRenewal(user?.gmailWatchExpiresAt ?? null);
  const renewCalendar = force || needsRenewal(user?.calendarWatchExpiresAt ?? null);

  if (!renewGmail && !renewCalendar) {
    return { tenantId, gmail: "skipped", calendar: "skipped" };
  }

  let gmailExpiresAt: Date | null = null;
  let calendarExpiresAt: Date | null = null;
  let gmailStatus: WatchRenewResult["gmail"] = "skipped";
  let calendarStatus: WatchRenewResult["calendar"] = "skipped";
  const errors: string[] = [];

  if (renewGmail) {
    try {
      gmailExpiresAt = await renewGmailWatch(tenantId);
      gmailStatus = "renewed";
    } catch (error) {
      gmailStatus = "failed";
      errors.push(error instanceof Error ? error.message : "Gmail watch failed");
    }
  }

  if (renewCalendar) {
    try {
      calendarExpiresAt = await renewCalendarWatch(tenantId);
      calendarStatus = "renewed";
    } catch (error) {
      calendarStatus = "failed";
      errors.push(error instanceof Error ? error.message : "Calendar watch failed");
    }
  }

  if (gmailExpiresAt || calendarExpiresAt) {
    await saveWatchExpirations(tenantId, gmailExpiresAt, calendarExpiresAt);
  }

  return {
    tenantId,
    gmail: gmailStatus,
    calendar: calendarStatus,
    gmailExpiresAt: gmailExpiresAt?.toISOString(),
    calendarExpiresAt: calendarExpiresAt?.toISOString(),
    error: errors.length > 0 ? errors.join("; ") : undefined,
  };
}

export async function renewWatchesIfNeeded(tenantId: string): Promise<void> {
  await renewWatchesForTenant(tenantId, { force: false });
}

export async function renewWatchesForAllTenants(options?: {
  force?: boolean;
}): Promise<WatchRenewResult[]> {
  const allUsers = await db.select({ id: users.id }).from(users);
  const results: WatchRenewResult[] = [];

  for (const user of allUsers) {
    try {
      const result = await renewWatchesForTenant(user.id, options);
      if (result.gmail !== "skipped" || result.calendar !== "skipped") {
        results.push(result);
      }
    } catch (error) {
      results.push({
        tenantId: user.id,
        gmail: "failed",
        calendar: "failed",
        error: error instanceof Error ? error.message : "Renew failed",
      });
    }
  }

  return results;
}
