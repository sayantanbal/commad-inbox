import {
  htmlToPlainText,
} from "@/lib/gmail/email-html";
import type { Attachment, Message, Participant, Thread } from "@/lib/types";

type MessagePartHeader = { name?: string; value?: string };
type MessagePartShape = {
  mimeType?: string;
  filename?: string;
  headers?: MessagePartHeader[];
  body?: { data?: string; attachmentId?: string; size?: number };
  parts?: MessagePartShape[];
};

type GmailMessage = {
  id?: string;
  threadId?: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: Date | string | number | null;
  payload?: MessagePartShape;
};

type GmailThread = {
  id?: string;
  snippet?: string;
  messages?: GmailMessage[];
};

function parseEmailAddress(raw: string): Participant {
  const match = raw.match(/^(?:"?([^"]*)"?\s)?<?([^>]+@[^>]+)>?$/);
  if (!match) {
    return { name: raw.trim(), email: raw.trim() };
  }
  const name = match[1]?.trim();
  const email = match[2]?.trim() ?? raw.trim();
  return { name: name || email, email };
}

function getHeader(payload: MessagePartShape | undefined, name: string): string | undefined {
  return payload?.headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())
    ?.value;
}

function decodeBody(data?: string): string {
  if (!data) return "";
  try {
    return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  } catch {
    return data;
  }
}

function extractBodies(payload?: MessagePartShape): { plain: string; html: string | null } {
  if (!payload) return { plain: "", html: null };

  let html: string | null = null;
  let plain: string | null = null;

  function walk(part: MessagePartShape) {
    if (part.parts?.length) {
      for (const child of part.parts) {
        walk(child);
      }
      return;
    }

    const mime = part.mimeType ?? "";

    if (mime === "text/html" && part.body?.data) {
      html ??= decodeBody(part.body.data);
      return;
    }
    if (mime === "text/plain" && part.body?.data) {
      plain ??= decodeBody(part.body.data);
      return;
    }

    if (part.body?.data) {
      const raw = decodeBody(part.body.data);
      if (raw.trimStart().startsWith("<")) {
        html ??= raw;
      } else {
        plain ??= raw;
      }
    }
  }

  walk(payload);

  if (html && !plain) {
    plain = htmlToPlainText(html);
  }

  return {
    plain: plain ?? "",
    html,
  };
}

function extractAttachments(payload?: MessagePartShape): Attachment[] {
  if (!payload?.parts?.length) return [];

  const attachments: Attachment[] = [];
  for (const part of payload.parts) {
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        id: part.body.attachmentId,
        filename: part.filename,
        mimeType: part.mimeType ?? "application/octet-stream",
        size: part.body.size ?? 0,
      });
    }
    attachments.push(...extractAttachments(part));
  }
  return attachments;
}

function toTimestamp(internalDate?: Date | string | number | null): Date {
  if (internalDate instanceof Date) return internalDate;
  if (typeof internalDate === "number") return new Date(internalDate);
  if (typeof internalDate === "string" && internalDate) {
    const numeric = Number(internalDate);
    if (!Number.isNaN(numeric)) return new Date(numeric);
    return new Date(internalDate);
  }
  return new Date();
}

function mapMessage(message: GmailMessage): Message {
  const fromRaw = getHeader(message.payload, "From") ?? "Unknown";
  const toRaw = getHeader(message.payload, "To") ?? "";
  const to = toRaw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map(parseEmailAddress);

  const { plain, html } = extractBodies(message.payload);

  return {
    id: message.id ?? crypto.randomUUID(),
    from: parseEmailAddress(fromRaw),
    to,
    body: plain || message.snippet || "",
    bodyHtml: html,
    timestamp: toTimestamp(message.internalDate),
    attachments: extractAttachments(message.payload),
  };
}

export function mapGmailThread(thread: GmailThread): Thread | null {
  if (!thread.id) return null;

  const messages = (thread.messages ?? []).map(mapMessage);
  const latestMessage = messages.at(-1);
  const subject =
    getHeader(thread.messages?.[0]?.payload, "Subject") ??
    latestMessage?.body.slice(0, 80) ??
    "(No subject)";
  const participants = new Map<string, Participant>();

  for (const message of messages) {
    participants.set(message.from.email, message.from);
    for (const recipient of message.to) {
      participants.set(recipient.email, recipient);
    }
  }

  const labelIds = thread.messages?.flatMap((message) => message.labelIds ?? []) ?? [];

  return {
    id: thread.id,
    subject,
    snippet: thread.snippet ?? latestMessage?.body.slice(0, 140) ?? "",
    messages,
    participants: [...participants.values()],
    labels: [...new Set(labelIds)],
    timestamp: latestMessage?.timestamp ?? new Date(),
    unread: labelIds.includes("UNREAD"),
  };
}
