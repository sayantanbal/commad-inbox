/** Gmail search uses YYYY/MM/DD for after:/before: operators. */
export function formatGmailDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

export function buildGmailSearchQuery(filters: {
  query?: string;
  sender?: string;
  after?: string;
  before?: string;
  hasAttachment?: boolean;
}): string {
  const parts: string[] = [];

  if (filters.query?.trim()) {
    parts.push(filters.query.trim());
  }
  if (filters.sender?.trim()) {
    const sender = filters.sender.trim();
    parts.push(sender.includes("@") ? `from:${sender}` : `from:${sender}`);
  }
  if (filters.after) {
    parts.push(`after:${formatGmailDate(new Date(filters.after))}`);
  }
  if (filters.before) {
    parts.push(`before:${formatGmailDate(new Date(filters.before))}`);
  }
  if (filters.hasAttachment) {
    parts.push("has:attachment");
  }

  return parts.join(" ").trim();
}
