import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  sendEmailToolInputSchema,
  stageThreadAttachmentToolInputSchema,
} from "@/lib/schemas/agent-tools";
import {
  MAX_ATTACHMENT_BYTES,
  validateSingleAttachmentSize,
  validateTotalAttachmentSize,
} from "@/lib/gmail/attachment-limits";

const STAGED_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("attachment stage → send chain", () => {
  test("stage_thread_attachment output id is accepted by send_email.attachmentIds", () => {
    const staged = stageThreadAttachmentToolInputSchema.parse({
      messageId: "msg-abc123",
      attachmentId: "att-xyz",
      filename: "proposal.pdf",
      mimeType: "application/pdf",
      sizeBytes: 512_000,
    });

    expect(staged.sizeBytes).toBeLessThanOrEqual(MAX_ATTACHMENT_BYTES);
    expect(validateSingleAttachmentSize(staged.sizeBytes)).toBeNull();

    const sendInput = sendEmailToolInputSchema.parse({
      to: "client@example.com",
      subject: "Updated proposal",
      body: "Please find the attached proposal.",
      attachmentIds: [STAGED_ID],
    });

    expect(sendInput.attachmentIds).toEqual([STAGED_ID]);
    expect(validateTotalAttachmentSize(staged.sizeBytes)).toBeNull();
  });

  test("send_email chain flags oversize staged bytes via attachment limits", () => {
    const oversized = MAX_ATTACHMENT_BYTES + 1;
    const staged = stageThreadAttachmentToolInputSchema.parse({
      messageId: "msg-1",
      attachmentId: "att-1",
      filename: "huge.zip",
      mimeType: "application/zip",
      sizeBytes: oversized,
    });
    expect(validateSingleAttachmentSize(staged.sizeBytes)).toBeTruthy();
  });
});

describe("agent eval fixtures", () => {
  test("inbox-agent.xml declares 10 read-only pairs", () => {
    const xml = readFileSync(
      join(import.meta.dir, "../../../evaluations/inbox-agent.xml"),
      "utf8"
    );
    const count = (xml.match(/<qa_pair /g) ?? []).length;
    expect(count).toBe(10);
  });

  test("policy fixture blocks run_script per OD-5", () => {
    const fixture = JSON.parse(
      readFileSync(join(import.meta.dir, "../../../evaluations/fixtures/agent-tools.json"), "utf8")
    ) as { corsairDiscovery: { blockedTools: string[] } };
    expect(fixture.corsairDiscovery.blockedTools).toContain("run_script");
  });
});
