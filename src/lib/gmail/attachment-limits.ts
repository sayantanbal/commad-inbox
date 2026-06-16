export const GMAIL_MAX_MESSAGE_BYTES = 25 * 1024 * 1024;
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
export const MAX_MESSAGE_ATTACHMENTS_BYTES = 22 * 1024 * 1024;
export const WARN_ATTACHMENTS_BYTES = 15 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_MESSAGE = 10;

export const OVERSIZE_ATTACHMENT_MESSAGE =
  "This exceeds Gmail's native attachment limit. Smart large-file handling is coming soon—this agent will compress, split, or route oversized files automatically.";

const BLOCKED_MIME_PREFIXES = ["application/x-msdownload", "application/x-executable"];
const BLOCKED_MIME_EXACT = new Set([
  "application/vnd.microsoft.portable-executable",
  "application/x-sh",
  "application/x-bat",
]);

const ALLOWED_MIME_PREFIXES = ["image/", "audio/", "video/", "text/"];
const ALLOWED_MIME_EXACT = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "text/csv",
  "text/plain",
]);

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isAllowedMimeType(mimeType: string): boolean {
  const normalized = mimeType.toLowerCase().split(";")[0]?.trim() ?? "";
  if (!normalized) return false;
  if (BLOCKED_MIME_EXACT.has(normalized)) return false;
  if (BLOCKED_MIME_PREFIXES.some((prefix) => normalized.startsWith(prefix))) return false;
  if (ALLOWED_MIME_EXACT.has(normalized)) return true;
  return ALLOWED_MIME_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function validateSingleAttachmentSize(sizeBytes: number): string | null {
  if (sizeBytes <= 0) return "Attachment is empty.";
  if (sizeBytes > MAX_ATTACHMENT_BYTES) return OVERSIZE_ATTACHMENT_MESSAGE;
  return null;
}

export function validateTotalAttachmentSize(totalBytes: number): string | null {
  if (totalBytes > MAX_MESSAGE_ATTACHMENTS_BYTES) return OVERSIZE_ATTACHMENT_MESSAGE;
  return null;
}

export function attachmentSizeWarning(totalBytes: number): string | null {
  if (totalBytes >= WARN_ATTACHMENTS_BYTES && totalBytes <= MAX_MESSAGE_ATTACHMENTS_BYTES) {
    return `Attachments are ${formatBytes(totalBytes)} — close to Gmail's native limit.`;
  }
  return null;
}

export function encodeMimeFilename(filename: string): string {
  if (/^[\x20-\x7E]+$/.test(filename)) return filename;
  return `=?UTF-8?B?${Buffer.from(filename, "utf8").toString("base64")}?=`;
}
