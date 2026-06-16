import { and, eq, lte } from "drizzle-orm";
import type { CorsairInstance } from "@/lib/corsair";
import { sendGmailMessage } from "@/lib/corsair/actions";
import { db } from "@/lib/db";
import { scheduledSends } from "@/lib/db/schema";
import { resolveAttachmentsForSend } from "@/lib/gmail/resolve-attachments";
import { deleteOutboundAttachments } from "@/lib/gmail/outbound-attachment";

export async function queueSend(
  userId: string,
  params: {
    to: string[];
    subject: string;
    body: string;
    threadId?: string;
    sendAt: Date;
    attachmentIds?: string[];
  }
): Promise<{ id: string; sendAt: Date }> {
  const attachmentIds = params.attachmentIds ?? [];
  if (attachmentIds.length > 0) {
    await resolveAttachmentsForSend(userId, attachmentIds);
  }

  const id = crypto.randomUUID();
  await db.insert(scheduledSends).values({
    id,
    userId,
    threadId: params.threadId ?? null,
    to: params.to,
    subject: params.subject,
    body: params.body,
    attachmentIds,
    sendAt: params.sendAt,
    status: "pending",
  });
  return { id, sendAt: params.sendAt };
}

export async function cancelQueuedSend(userId: string, id: string): Promise<boolean> {
  const result = await db
    .update(scheduledSends)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(scheduledSends.id, id),
        eq(scheduledSends.userId, userId),
        eq(scheduledSends.status, "pending")
      )
    )
    .returning({ id: scheduledSends.id });

  return result.length > 0;
}

export async function dispatchScheduledSend(
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  userId: string,
  id: string,
  fromEmail: string
): Promise<{ messageId: string } | null> {
  const [row] = await db
    .select()
    .from(scheduledSends)
    .where(and(eq(scheduledSends.id, id), eq(scheduledSends.userId, userId)));

  if (!row || row.status !== "pending" || row.sendAt > new Date()) {
    return null;
  }

  const [claimed] = await db
    .update(scheduledSends)
    .set({ status: "sent", sentAt: new Date() })
    .where(
      and(
        eq(scheduledSends.id, id),
        eq(scheduledSends.userId, userId),
        eq(scheduledSends.status, "pending")
      )
    )
    .returning();

  if (!claimed) return null;

  try {
    const attachments = await resolveAttachmentsForSend(userId, claimed.attachmentIds);
    const result = await sendGmailMessage(tenant, {
      from: fromEmail,
      to: claimed.to,
      subject: claimed.subject,
      bodyHtml: claimed.body,
      threadId: claimed.threadId ?? undefined,
      attachments,
    });
    if (claimed.attachmentIds.length > 0) {
      await deleteOutboundAttachments(userId, claimed.attachmentIds);
    }
    return { messageId: result.messageId };
  } catch (error) {
    await db.update(scheduledSends).set({ status: "failed" }).where(eq(scheduledSends.id, id));
    throw error;
  }
}

export async function processDueSends(
  tenantFactory: (userId: string) => ReturnType<CorsairInstance["withTenant"]>,
  userEmailById: Map<string, string>
): Promise<number> {
  const due = await db
    .select()
    .from(scheduledSends)
    .where(and(eq(scheduledSends.status, "pending"), lte(scheduledSends.sendAt, new Date())));

  let sent = 0;
  for (const row of due) {
    const email = userEmailById.get(row.userId);
    if (!email) continue;
    const tenant = tenantFactory(row.userId);
    const result = await dispatchScheduledSend(tenant, row.userId, row.id, email);
    if (result) sent++;
  }
  return sent;
}
