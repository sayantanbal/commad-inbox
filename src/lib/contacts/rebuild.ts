import "server-only";

import { format, subDays } from "date-fns";
import { and, desc, eq } from "drizzle-orm";
import { generateJsonWithProvider } from "@/lib/ai/generate";
import { getDefaultProvider } from "@/lib/ai/with-fallback";
import type { CorsairInstance } from "@/lib/corsair";
import { mapGmailThread } from "@/lib/corsair/gmail-parse";
import { getCommitmentsForUser } from "@/lib/commitments/queries";
import { listAppContactsForUser } from "@/lib/contacts/app-contacts";
import { db } from "@/lib/db";
import { contacts, meetingBriefs } from "@/lib/db/schema";
import { meetingBriefStoredSchema, type MeetingBriefStored } from "@/lib/schemas/domain";

const PRE_BRIEF_SYSTEM = `Generate a meeting pre-brief JSON for an upcoming meeting with an email contact.
Include toneSummary as one sentence about their last message sentiment. attachmentsNote summarizes recent attachments or "None recently."`;

export async function generateMeetingBrief(
  userId: string,
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  attendeeEmail: string,
  attendeeName?: string
): Promise<MeetingBriefStored> {
  const briefDate = format(new Date(), "yyyy-MM-dd");
  const cacheId = `${userId}:${attendeeEmail}:${briefDate}`;

  const [cached] = await db
    .select()
    .from(meetingBriefs)
    .where(eq(meetingBriefs.id, cacheId));

  if (cached) return cached.brief;

  const searchResult = await tenant.gmail.api.threads.list({
    q: `from:${attendeeEmail} OR to:${attendeeEmail}`,
    maxResults: 5,
  });

  const threadIds = (searchResult.threads ?? []).slice(0, 3).map((t) => t.id!).filter(Boolean);
  const recentThreads: MeetingBriefStored["recentThreads"] = [];

  for (const threadId of threadIds) {
    const full = await tenant.gmail.api.threads.get({ id: threadId, format: "metadata" });
    const mapped = mapGmailThread(full);
    if (!mapped) continue;
    recentThreads.push({
      subject: mapped.subject,
      snippet: mapped.snippet,
      date: format(mapped.timestamp, "MMM d"),
    });
  }

  const openCommitments = await getCommitmentsForUser(userId, {
    direction: "inbound",
    status: ["open"],
  });
  const relevant = openCommitments
    .filter((c) => c.counterpartyEmail.toLowerCase() === attendeeEmail.toLowerCase())
    .map((c) => c.text);

  const prompt = [
    `Attendee: ${attendeeName ?? attendeeEmail} <${attendeeEmail}>`,
    "Recent threads:",
    ...recentThreads.map((t) => `- ${t.subject}: ${t.snippet}`),
    "Open commitments:",
    ...relevant.map((t) => `- ${t}`),
  ].join("\n");

  let brief: MeetingBriefStored;
  try {
    const preferred = await getDefaultProvider(userId);
    const { data } = await generateJsonWithProvider(
      userId,
      preferred,
      prompt,
      PRE_BRIEF_SYSTEM,
      meetingBriefStoredSchema
    );
    brief = {
      ...data,
      attendeeEmail,
      attendeeName: attendeeName ?? attendeeEmail.split("@")[0],
      recentThreads,
      openCommitments: relevant,
    };
  } catch {
    brief = {
      attendeeName: attendeeName ?? attendeeEmail.split("@")[0],
      attendeeEmail,
      recentThreads,
      openCommitments: relevant,
      attachmentsNote: "None recently.",
      toneSummary: "Neutral — awaiting your review.",
    };
  }

  await db
    .insert(meetingBriefs)
    .values({ id: cacheId, userId, attendeeEmail, briefDate, brief, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: meetingBriefs.id,
      set: { brief, updatedAt: new Date() },
    });

  return brief;
}

export async function rebuildContactsForUser(
  userId: string,
  tenant: ReturnType<CorsairInstance["withTenant"]>
): Promise<number> {
  const since = subDays(new Date(), 90);
  const threads = await tenant.gmail.api.threads.list({ maxResults: 100 });
  const counts = new Map<string, { name: string; count: number; lastAt: Date }>();

  for (const t of threads.threads ?? []) {
    if (!t.id) continue;
    const full = await tenant.gmail.api.threads.get({ id: t.id, format: "metadata" });
    const mapped = mapGmailThread(full);
    if (!mapped || mapped.timestamp < since) continue;

    for (const p of mapped.participants) {
      const email = p.email.toLowerCase();
      const existing = counts.get(email);
      if (existing) {
        existing.count++;
        if (mapped.timestamp > existing.lastAt) existing.lastAt = mapped.timestamp;
      } else {
        counts.set(email, { name: p.name || email, count: 1, lastAt: mapped.timestamp });
      }
    }
  }

  const top50 = [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 50);

  const appRows = await listAppContactsForUser(userId);
  const appNameByEmail = new Map(
    appRows.map((row) => [row.email.toLowerCase(), row.displayName ?? row.email.split("@")[0]])
  );

  await db.delete(contacts).where(eq(contacts.userId, userId));

  const openCommitments = await getCommitmentsForUser(userId, { status: ["open"] });
  const commitmentByEmail = new Map<string, number>();
  for (const c of openCommitments) {
    const key = c.counterpartyEmail.toLowerCase();
    commitmentByEmail.set(key, (commitmentByEmail.get(key) ?? 0) + 1);
  }

  for (const [email, data] of top50) {
    const daysSince = Math.floor((Date.now() - data.lastAt.getTime()) / 86400000);
    let warmth: "cold" | "warm" | "active" | "new" = "warm";
    if (data.count <= 2) warmth = "new";
    else if (daysSince > 21) warmth = "cold";
    else if (daysSince <= 7) warmth = "active";

    await db.insert(contacts).values({
      id: `${userId}:${email}`,
      userId,
      email,
      displayName: appNameByEmail.get(email) ?? data.name,
      lastContactAt: data.lastAt,
      emailCount30d: data.count,
      warmth,
      openCommitmentCount: commitmentByEmail.get(email) ?? 0,
    });
  }

  return top50.length;
}

export async function getContactsForUser(userId: string) {
  return db
    .select()
    .from(contacts)
    .where(eq(contacts.userId, userId))
    .orderBy(desc(contacts.emailCount30d));
}
