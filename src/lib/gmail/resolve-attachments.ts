import {
  loadOutboundAttachmentsForSend,
  toRawEmailAttachments,
} from "@/lib/gmail/outbound-attachment";
import type { RawEmailAttachment } from "@/lib/gmail/raw-message";

export async function resolveAttachmentsForSend(
  userId: string,
  attachmentIds?: string[]
): Promise<RawEmailAttachment[]> {
  if (!attachmentIds || attachmentIds.length === 0) return [];
  const records = await loadOutboundAttachmentsForSend(userId, attachmentIds);
  return toRawEmailAttachments(records);
}
