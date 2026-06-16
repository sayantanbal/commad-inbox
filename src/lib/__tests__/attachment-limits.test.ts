import { describe, expect, test } from "bun:test";
import {
  MAX_ATTACHMENT_BYTES,
  MAX_MESSAGE_ATTACHMENTS_BYTES,
  OVERSIZE_ATTACHMENT_MESSAGE,
  validateSingleAttachmentSize,
  validateTotalAttachmentSize,
  attachmentSizeWarning,
  isAllowedMimeType,
} from "@/lib/gmail/attachment-limits";

describe("attachment-limits", () => {
  test("allows common mime families", () => {
    expect(isAllowedMimeType("image/png")).toBe(true);
    expect(isAllowedMimeType("application/pdf")).toBe(true);
    expect(isAllowedMimeType("audio/m4a")).toBe(true);
    expect(isAllowedMimeType("application/x-msdownload")).toBe(false);
  });

  test("rejects oversize single attachment", () => {
    expect(validateSingleAttachmentSize(MAX_ATTACHMENT_BYTES + 1)).toBe(
      OVERSIZE_ATTACHMENT_MESSAGE
    );
    expect(validateSingleAttachmentSize(MAX_ATTACHMENT_BYTES)).toBeNull();
  });

  test("rejects oversize total attachment bytes", () => {
    expect(validateTotalAttachmentSize(22 * 1024 * 1024)).toBeNull();
    expect(validateTotalAttachmentSize(23 * 1024 * 1024)).toBe(OVERSIZE_ATTACHMENT_MESSAGE);
    expect(validateTotalAttachmentSize(MAX_MESSAGE_ATTACHMENTS_BYTES + 1)).toBe(
      OVERSIZE_ATTACHMENT_MESSAGE
    );
  });

  test("warns near limit", () => {
    expect(attachmentSizeWarning(15 * 1024 * 1024)).toContain("close to Gmail");
    expect(attachmentSizeWarning(5 * 1024 * 1024)).toBeNull();
  });
});
