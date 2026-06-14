const MAX_LENGTH = 2048;
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /system\s*:/i,
  /you\s+are\s+now/i,
  /<\/?[a-z][\s\S]*>/i,
  /```[\s\S]*```/,
];

export interface WorkingDaysStructured {
  timezone: string;
  days: Record<
    string,
    { enabled: boolean; start: string; end: string }
  >;
}

export function sanitizeWorkingDaysText(raw: string): string | null {
  const trimmed = raw.trim().slice(0, MAX_LENGTH);
  if (!trimmed) return null;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) return null;
  }

  const lines = trimmed.split("\n").filter((l) => l.trim());
  if (lines.length > 50) return null;

  return trimmed
    .replace(/<[^>]+>/g, "")
    .replace(/```/g, "")
    .trim();
}

export function workingDaysToAiSummary(
  structured: WorkingDaysStructured | null,
  textOverride: string | null
): string {
  if (structured) {
    const active = Object.entries(structured.days)
      .filter(([, d]) => d.enabled)
      .map(([day, d]) => `${day} ${d.start}-${d.end}`);
    if (active.length > 0) {
      return `Available: ${active.join(", ")} (${structured.timezone})`;
    }
  }
  const sanitized = textOverride ? sanitizeWorkingDaysText(textOverride) : null;
  if (sanitized) {
    return `User schedule notes (summary only): ${sanitized.slice(0, 200)}`;
  }
  return "Available weekdays 9:00-17:00 local time";
}

export const DEFAULT_WORKING_DAYS: WorkingDaysStructured = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  days: {
    mon: { enabled: true, start: "09:00", end: "17:00" },
    tue: { enabled: true, start: "09:00", end: "17:00" },
    wed: { enabled: true, start: "09:00", end: "17:00" },
    thu: { enabled: true, start: "09:00", end: "17:00" },
    fri: { enabled: true, start: "09:00", end: "17:00" },
    sat: { enabled: false, start: "09:00", end: "17:00" },
    sun: { enabled: false, start: "09:00", end: "17:00" },
  },
};
