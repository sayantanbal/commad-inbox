import { describe, expect, test } from "bun:test";
import { buildRawEmail } from "@/lib/gmail/raw-message";

describe("buildRawEmail", () => {
  const base = {
    from: "me@example.com",
    to: ["friend@example.com"],
    subject: "Hello",
    bodyHtml: "<p>Hi there</p>",
  };

  test("builds simple html message without attachments", () => {
    const raw = buildRawEmail(base);
    const decoded = Buffer.from(raw.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
      "utf8"
    );
    expect(decoded).toContain("Content-Type: text/html");
    expect(decoded).not.toContain("multipart/mixed");
    expect(decoded).toContain("<p>Hi there</p>");
  });

  test("builds multipart/mixed message with base64 attachment", () => {
    const raw = buildRawEmail({
      ...base,
      attachments: [
        {
          filename: "notes.pdf",
          mimeType: "application/pdf",
          data: Buffer.from("%PDF-1.4"),
        },
      ],
    });
    const decoded = Buffer.from(raw.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
      "utf8"
    );
    expect(decoded).toContain("multipart/mixed");
    expect(decoded).toContain("Content-Transfer-Encoding: base64");
    expect(decoded).toContain('filename="notes.pdf"');
    expect(decoded).toContain(Buffer.from("%PDF-1.4").toString("base64"));
  });
});
