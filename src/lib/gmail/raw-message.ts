interface RawEmailInput {
  from: string;
  to: string[];
  subject: string;
  bodyHtml: string;
  inReplyTo?: string;
  references?: string;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function buildRawEmail(input: RawEmailInput): string {
  const headers = [
    `From: ${input.from}`,
    `To: ${input.to.join(", ")}`,
    `Subject: ${input.subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
  ];

  if (input.inReplyTo) {
    headers.push(`In-Reply-To: ${input.inReplyTo}`);
  }
  if (input.references) {
    headers.push(`References: ${input.references}`);
  }

  const message = `${headers.join("\r\n")}\r\n\r\n${input.bodyHtml}`;
  return encodeBase64Url(message);
}
