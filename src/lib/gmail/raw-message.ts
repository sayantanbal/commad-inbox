import { encodeMimeFilename } from "@/lib/gmail/attachment-limits";

export interface RawEmailAttachment {
  filename: string;
  mimeType: string;
  data: Buffer;
}

interface RawEmailInput {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml: string;
  inReplyTo?: string;
  references?: string;
  attachments?: RawEmailAttachment[];
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildAddressHeaders(input: RawEmailInput): string[] {
  return [
    `From: ${input.from}`,
    `To: ${input.to.join(", ")}`,
    ...(input.cc?.length ? [`Cc: ${input.cc.join(", ")}`] : []),
    ...(input.bcc?.length ? [`Bcc: ${input.bcc.join(", ")}`] : []),
    `Subject: ${input.subject}`,
    "MIME-Version: 1.0",
  ];
}

function buildThreadHeaders(input: RawEmailInput): string[] {
  const headers: string[] = [];
  if (input.inReplyTo) headers.push(`In-Reply-To: ${input.inReplyTo}`);
  if (input.references) headers.push(`References: ${input.references}`);
  return headers;
}

function buildSimpleHtmlMessage(input: RawEmailInput): string {
  const headers = [
    ...buildAddressHeaders(input),
    'Content-Type: text/html; charset="UTF-8"',
    ...buildThreadHeaders(input),
  ];
  return `${headers.join("\r\n")}\r\n\r\n${input.bodyHtml}`;
}

function buildMultipartMessage(input: RawEmailInput, attachments: RawEmailAttachment[]): string {
  const boundary = `=_ci_${crypto.randomUUID().replace(/-/g, "")}`;
  const headers = [
    ...buildAddressHeaders(input),
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ...buildThreadHeaders(input),
  ];

  const parts: string[] = [];
  parts.push(
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    input.bodyHtml
  );

  for (const attachment of attachments) {
    const filename = encodeMimeFilename(attachment.filename);
    parts.push(
      `--${boundary}`,
      `Content-Type: ${attachment.mimeType}; name="${filename}"`,
      `Content-Disposition: attachment; filename="${filename}"`,
      "Content-Transfer-Encoding: base64",
      "",
      attachment.data.toString("base64")
    );
  }

  parts.push(`--${boundary}--`, "");
  return `${headers.join("\r\n")}\r\n\r\n${parts.join("\r\n")}`;
}

export function buildRawEmail(input: RawEmailInput): string {
  const attachments = input.attachments?.filter((item) => item.data.length > 0) ?? [];
  const message =
    attachments.length > 0
      ? buildMultipartMessage(input, attachments)
      : buildSimpleHtmlMessage(input);
  return encodeBase64Url(message);
}
