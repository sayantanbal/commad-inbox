import { and, eq, inArray, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { outboundAttachments } from "@/lib/db/schema";
import type { CorsairInstance } from "@/lib/corsair";
import { fetchGmailAttachmentData, getGmailAccessToken } from "@/lib/corsair/google-proxy";
import {
  isAllowedMimeType,
  MAX_ATTACHMENTS_PER_MESSAGE,
  validateSingleAttachmentSize,
  validateTotalAttachmentSize,
} from "@/lib/gmail/attachment-limits";
import type { RawEmailAttachment } from "@/lib/gmail/raw-message";

const ATTACHMENT_TTL_MS = 24 * 60 * 60 * 1000;

export type OutboundAttachmentMeta = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  source: "upload" | "thread_forward";
};

export type OutboundAttachmentRecord = OutboundAttachmentMeta & {
  data: Buffer;
};

function rowToMeta(row: typeof outboundAttachments.$inferSelect): OutboundAttachmentMeta {
  return {
    id: row.id,
    filename: row.filename,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    source: row.source,
  };
}

export async function purgeExpiredOutboundAttachments(): Promise<void> {
  await db
    .delete(outboundAttachments)
    .where(lt(outboundAttachments.expiresAt, new Date()));
}

export async function storeOutboundAttachment(
  userId: string,
  params: {
    filename: string;
    mimeType: string;
    data: Buffer;
    source: "upload" | "thread_forward";
    sourceMessageId?: string;
    sourceAttachmentId?: string;
  }
): Promise<OutboundAttachmentMeta> {
  const sizeError = validateSingleAttachmentSize(params.data.length);
  if (sizeError) throw new Error(sizeError);
  if (!isAllowedMimeType(params.mimeType)) {
    throw new Error("File type is not supported for native Gmail attachments.");
  }

  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + ATTACHMENT_TTL_MS);

  await db.insert(outboundAttachments).values({
    id,
    userId,
    filename: params.filename,
    mimeType: params.mimeType,
    sizeBytes: params.data.length,
    data: params.data,
    source: params.source,
    sourceMessageId: params.sourceMessageId ?? null,
    sourceAttachmentId: params.sourceAttachmentId ?? null,
    expiresAt,
  });

  return {
    id,
    filename: params.filename,
    mimeType: params.mimeType,
    sizeBytes: params.data.length,
    source: params.source,
  };
}

export async function deleteOutboundAttachment(userId: string, id: string): Promise<boolean> {
  const result = await db
    .delete(outboundAttachments)
    .where(and(eq(outboundAttachments.id, id), eq(outboundAttachments.userId, userId)))
    .returning({ id: outboundAttachments.id });
  return result.length > 0;
}

export async function listOutboundAttachmentMeta(
  userId: string,
  ids: string[]
): Promise<OutboundAttachmentMeta[]> {
  if (ids.length === 0) return [];
  await purgeExpiredOutboundAttachments();

  const rows = await db
    .select({
      id: outboundAttachments.id,
      filename: outboundAttachments.filename,
      mimeType: outboundAttachments.mimeType,
      sizeBytes: outboundAttachments.sizeBytes,
      source: outboundAttachments.source,
    })
    .from(outboundAttachments)
    .where(and(eq(outboundAttachments.userId, userId), inArray(outboundAttachments.id, ids)));

  return rows.map((row) => ({
    id: row.id,
    filename: row.filename,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    source: row.source,
  }));
}

export async function loadOutboundAttachmentsForSend(
  userId: string,
  ids: string[]
): Promise<OutboundAttachmentRecord[]> {
  if (ids.length === 0) return [];
  if (ids.length > MAX_ATTACHMENTS_PER_MESSAGE) {
    throw new Error(`At most ${MAX_ATTACHMENTS_PER_MESSAGE} attachments per message.`);
  }

  await purgeExpiredOutboundAttachments();

  const rows = await db
    .select()
    .from(outboundAttachments)
    .where(and(eq(outboundAttachments.userId, userId), inArray(outboundAttachments.id, ids)));

  if (rows.length !== ids.length) {
    throw new Error("One or more attachments are missing or expired.");
  }

  const totalBytes = rows.reduce((sum, row) => sum + row.sizeBytes, 0);
  const totalError = validateTotalAttachmentSize(totalBytes);
  if (totalError) throw new Error(totalError);

  return rows.map((row) => ({
    ...rowToMeta(row),
    data: Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data as Uint8Array),
  }));
}

export function toRawEmailAttachments(records: OutboundAttachmentRecord[]): RawEmailAttachment[] {
  return records.map((record) => ({
    filename: record.filename,
    mimeType: record.mimeType,
    data: record.data,
  }));
}

export async function stageThreadAttachment(
  userId: string,
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  params: {
    messageId: string;
    attachmentId: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
  }
): Promise<OutboundAttachmentMeta> {
  const accessToken = await getGmailAccessToken(tenant);
  const data = await fetchGmailAttachmentData(accessToken, params.messageId, params.attachmentId);

  if (data.length !== params.sizeBytes && params.sizeBytes > 0) {
    // Gmail may report size differently after decode — trust actual buffer length.
  }

  return storeOutboundAttachment(userId, {
    filename: params.filename,
    mimeType: params.mimeType || "application/octet-stream",
    data,
    source: "thread_forward",
    sourceMessageId: params.messageId,
    sourceAttachmentId: params.attachmentId,
  });
}

export async function deleteOutboundAttachments(userId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db
    .delete(outboundAttachments)
    .where(and(eq(outboundAttachments.userId, userId), inArray(outboundAttachments.id, ids)));
}
