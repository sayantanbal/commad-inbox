import type { ParsedContactInput } from "@/lib/contacts/app-contacts";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export type ImportFormat = "vcf" | "csv" | "plain" | "unknown";

export function detectImportFormat(filename: string, content: string): ImportFormat {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".vcf") || content.includes("BEGIN:VCARD")) return "vcf";
  if (lower.endsWith(".csv") || content.includes(",")) return "csv";
  if (content.match(EMAIL_RE)) return "plain";
  return "unknown";
}

function extractEmails(text: string): string[] {
  const matches = text.match(EMAIL_RE) ?? [];
  return [...new Set(matches.map((e) => e.toLowerCase()))];
}

export function parseVcf(content: string): ParsedContactInput[] {
  const contacts: ParsedContactInput[] = [];
  const cards = content.split(/BEGIN:VCARD/i).slice(1);

  for (const card of cards) {
    const block = card.split(/END:VCARD/i)[0] ?? card;
    const emails = extractEmails(block);
    if (emails.length === 0) continue;

    const fnMatch = block.match(/^FN[^:]*:(.+)$/im);
    const nameMatch = block.match(/^N[^:]*:(.+)$/im);
    const displayName = fnMatch?.[1]?.trim() || nameMatch?.[1]?.split(";")[1]?.trim();

    for (const email of emails) {
      contacts.push({ email, displayName: displayName || undefined });
    }
  }

  return dedupeContacts(contacts);
}

export function parseCsv(content: string): ParsedContactInput[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const header = lines[0].toLowerCase();
  const hasHeader = header.includes("email") || header.includes("name");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const emailCol = hasHeader
    ? header.split(",").findIndex((c) => c.includes("email"))
    : -1;
  const nameCol = hasHeader
    ? header.split(",").findIndex((c) => c.includes("name") && !c.includes("email"))
    : -1;

  const contacts: ParsedContactInput[] = [];

  for (const line of dataLines) {
    const cols = parseCsvLine(line);
    if (hasHeader && emailCol >= 0 && cols[emailCol]) {
      const email = cols[emailCol].trim();
      if (!email.includes("@")) continue;
      contacts.push({
        email,
        displayName: nameCol >= 0 ? cols[nameCol]?.trim() : undefined,
      });
      continue;
    }

    const emails = extractEmails(line);
    for (const email of emails) {
      contacts.push({ email });
    }
  }

  return dedupeContacts(contacts);
}

export function parsePlainEmailList(content: string): ParsedContactInput[] {
  const contacts: ParsedContactInput[] = [];

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const emails = extractEmails(trimmed);
    if (emails.length === 0) continue;

    const namePart = trimmed.replace(EMAIL_RE, "").replace(/[<>,]/g, "").trim();
    for (const email of emails) {
      contacts.push({ email, displayName: namePart || undefined });
    }
  }

  return dedupeContacts(contacts);
}

export function parseContactFile(filename: string, content: string): ParsedContactInput[] {
  const format = detectImportFormat(filename, content);
  switch (format) {
    case "vcf":
      return parseVcf(content);
    case "csv":
      return parseCsv(content);
    case "plain":
      return parsePlainEmailList(content);
    default:
      return parsePlainEmailList(content);
  }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((s) => s.replace(/^"|"$/g, "").trim());
}

function dedupeContacts(contacts: ParsedContactInput[]): ParsedContactInput[] {
  const byEmail = new Map<string, ParsedContactInput>();
  for (const c of contacts) {
    const email = c.email.trim().toLowerCase();
    if (!email.includes("@")) continue;
    const existing = byEmail.get(email);
    if (!existing || (!existing.displayName && c.displayName)) {
      byEmail.set(email, { ...c, email });
    }
  }
  return [...byEmail.values()];
}
