import "server-only";

import { randomUUID } from "crypto";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { getContactsForUser } from "@/lib/contacts/rebuild";
import { db } from "@/lib/db";
import { appContacts, contactDismissals } from "@/lib/db/schema";

export type AppContactSource = "manual" | "import" | "google" | "gmail-sent" | "demo";

export interface ParsedContactInput {
  email: string;
  displayName?: string;
}

export interface MergedContactRow {
  id: string;
  email: string;
  displayName: string;
  source: string;
  lastContactAt: string | null;
  avgResponseHours: number | null;
  emailCount30d: number;
  warmth: string;
  openCommitmentCount: number;
  isAppContact: boolean;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function listAppContactsForUser(userId: string) {
  return db
    .select()
    .from(appContacts)
    .where(and(eq(appContacts.userId, userId), eq(appContacts.status, "active")));
}

export async function getDismissedEmailsForUser(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ email: contactDismissals.email })
    .from(contactDismissals)
    .where(eq(contactDismissals.userId, userId));
  return new Set(rows.map((row) => row.email.toLowerCase()));
}

export async function addAppContact(
  userId: string,
  input: ParsedContactInput,
  source: AppContactSource = "manual"
): Promise<{ id: string; created: boolean }> {
  const email = normalizeEmail(input.email);
  const [existing] = await db
    .select({ id: appContacts.id })
    .from(appContacts)
    .where(and(eq(appContacts.userId, userId), eq(appContacts.email, email)))
    .limit(1);

  if (existing) {
    await db
      .update(appContacts)
      .set({
        displayName: input.displayName ?? undefined,
        status: "active",
        source,
      })
      .where(eq(appContacts.id, existing.id));
    return { id: existing.id, created: false };
  }

  const id = randomUUID();
  await db.insert(appContacts).values({
    id,
    userId,
    email,
    displayName: input.displayName ?? null,
    source,
    status: "active",
  });
  return { id, created: true };
}

export async function upsertAppContacts(
  userId: string,
  contacts: ParsedContactInput[],
  source: AppContactSource
): Promise<{ imported: number; skipped: number }> {
  let imported = 0;
  let skipped = 0;

  for (const contact of contacts) {
    const email = normalizeEmail(contact.email);
    if (!email.includes("@")) {
      skipped++;
      continue;
    }
    const result = await addAppContact(userId, { ...contact, email }, source);
    if (result.created) imported++;
    else skipped++;
  }

  return { imported, skipped };
}

export interface AppContactRow {
  id: string;
  email: string;
  displayName: string | null;
  source: string;
  createdAt: string;
}

export async function listAppContactsPaginated(
  userId: string,
  options: { page: number; pageSize: number; search?: string }
): Promise<{ contacts: AppContactRow[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, options.page);
  const pageSize = Math.min(100, Math.max(1, options.pageSize));
  const offset = (page - 1) * pageSize;
  const search = options.search?.trim();

  const baseWhere = and(eq(appContacts.userId, userId), eq(appContacts.status, "active"));
  const where = search
    ? and(
        baseWhere,
        or(
          ilike(appContacts.email, `%${search}%`),
          ilike(appContacts.displayName, `%${search}%`)
        )
      )
    : baseWhere;

  const [totalRow] = await db.select({ value: count() }).from(appContacts).where(where);
  const total = Number(totalRow?.value ?? 0);

  const rows = await db
    .select()
    .from(appContacts)
    .where(where)
    .orderBy(desc(appContacts.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    contacts: rows.map((row) => ({
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      source: row.source,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
  };
}

export async function removeGoogleSourceContacts(userId: string): Promise<number> {
  const rows = await db
    .select({ id: appContacts.id })
    .from(appContacts)
    .where(
      and(
        eq(appContacts.userId, userId),
        eq(appContacts.source, "google"),
        eq(appContacts.status, "active")
      )
    );

  if (rows.length === 0) return 0;

  await db
    .update(appContacts)
    .set({ status: "dismissed" })
    .where(
      and(
        eq(appContacts.userId, userId),
        eq(appContacts.source, "google"),
        eq(appContacts.status, "active")
      )
    );

  return rows.length;
}

export async function dismissContact(userId: string, email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  const [existing] = await db
    .select({ id: contactDismissals.id })
    .from(contactDismissals)
    .where(and(eq(contactDismissals.userId, userId), eq(contactDismissals.email, normalized)))
    .limit(1);

  if (existing) return;

  await db.insert(contactDismissals).values({
    id: randomUUID(),
    userId,
    email: normalized,
  });

  await db
    .update(appContacts)
    .set({ status: "dismissed" })
    .where(and(eq(appContacts.userId, userId), eq(appContacts.email, normalized)));
}

export async function countAppContactsForUser(userId: string): Promise<number> {
  const rows = await listAppContactsForUser(userId);
  return rows.length;
}

export async function getMergedContactsForUser(userId: string): Promise<MergedContactRow[]> {
  const [warmthRows, appRows, dismissed] = await Promise.all([
    getContactsForUser(userId),
    listAppContactsForUser(userId),
    getDismissedEmailsForUser(userId),
  ]);

  const byEmail = new Map<string, MergedContactRow>();

  for (const row of warmthRows) {
    const email = row.email.toLowerCase();
    if (dismissed.has(email)) continue;
    byEmail.set(email, {
      id: row.id,
      email: row.email,
      displayName: row.displayName || row.email.split("@")[0],
      source: "gmail",
      lastContactAt: row.lastContactAt.toISOString(),
      avgResponseHours: row.avgResponseHours,
      emailCount30d: row.emailCount30d,
      warmth: row.warmth,
      openCommitmentCount: row.openCommitmentCount,
      isAppContact: false,
    });
  }

  for (const row of appRows) {
    const email = row.email.toLowerCase();
    if (dismissed.has(email)) continue;
    const existing = byEmail.get(email);
    if (existing) {
      byEmail.set(email, {
        ...existing,
        displayName: row.displayName || existing.displayName,
        source: row.source,
        isAppContact: true,
      });
      continue;
    }
    byEmail.set(email, {
      id: row.id,
      email: row.email,
      displayName: row.displayName || row.email.split("@")[0],
      source: row.source,
      lastContactAt: null,
      avgResponseHours: null,
      emailCount30d: 0,
      warmth: "new",
      openCommitmentCount: 0,
      isAppContact: true,
    });
  }

  return [...byEmail.values()].sort((a, b) => {
    const aScore = a.emailCount30d + (a.isAppContact ? 0 : 1000);
    const bScore = b.emailCount30d + (b.isAppContact ? 0 : 1000);
    return bScore - aScore;
  });
}

export function contactsToCsv(rows: MergedContactRow[]): string {
  const header = "email,display_name,source,warmth,last_contact_at";
  const lines = rows.map((row) => {
    const fields = [
      row.email,
      row.displayName.replace(/"/g, '""'),
      row.source,
      row.warmth,
      row.lastContactAt ?? "",
    ];
    return fields.map((f) => `"${f}"`).join(",");
  });
  return [header, ...lines].join("\n");
}

export async function exportAppContactsCsv(userId: string): Promise<string> {
  const rows = await getMergedContactsForUser(userId);
  return contactsToCsv(rows);
}

export async function importFromGmailSent(
  userId: string,
  tenant: ReturnType<import("@/lib/corsair").CorsairInstance["withTenant"]>
): Promise<{ imported: number; skipped: number }> {
  const searchResult = await tenant.gmail.api.threads.list({
    q: "in:sent",
    maxResults: 100,
  });

  const emails = new Map<string, string>();
  const { mapGmailThread } = await import("@/lib/corsair/gmail-parse");

  for (const t of searchResult.threads ?? []) {
    if (!t.id) continue;
    const full = await tenant.gmail.api.threads.get({ id: t.id, format: "metadata" });
    const mapped = mapGmailThread(full);
    if (!mapped) continue;
    for (const p of mapped.participants) {
      const email = p.email.toLowerCase();
      if (!email.includes("@")) continue;
      emails.set(email, p.name || email.split("@")[0]);
    }
  }

  const contacts: ParsedContactInput[] = [...emails.entries()].map(([email, displayName]) => ({
    email,
    displayName,
  }));

  return upsertAppContacts(userId, contacts, "gmail-sent");
}
