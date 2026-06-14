export interface TimezoneOption {
  value: string;
  label: string;
  group: string;
}

const FALLBACK_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;

function listTimezones(): string[] {
  if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
    return Intl.supportedValuesOf("timeZone");
  }
  return [...FALLBACK_TIMEZONES];
}

function formatOffset(timeZone: string): string {
  try {
    const part = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName");
    return part?.value ?? "";
  } catch {
    return "";
  }
}

function formatLabel(timeZone: string): string {
  const offset = formatOffset(timeZone);
  const suffix = timeZone.includes("/")
    ? timeZone.split("/").slice(1).join("/").replace(/_/g, " ")
    : timeZone;
  return offset ? `${offset} · ${suffix}` : suffix;
}

function groupFor(timeZone: string): string {
  if (!timeZone.includes("/")) return "Other";
  return timeZone.split("/")[0] ?? "Other";
}

let cachedOptions: TimezoneOption[] | null = null;

export function getTimezoneOptions(): TimezoneOption[] {
  if (cachedOptions) return cachedOptions;

  cachedOptions = listTimezones()
    .map((value) => ({
      value,
      label: formatLabel(value),
      group: groupFor(value),
    }))
    .sort((a, b) => {
      const groupCompare = a.group.localeCompare(b.group);
      if (groupCompare !== 0) return groupCompare;
      return a.label.localeCompare(b.label);
    });

  return cachedOptions;
}

export function resolveTimezoneSelection(stored: string | null | undefined): string {
  const zones = listTimezones();
  if (stored && zones.includes(stored)) return stored;

  if (typeof Intl !== "undefined") {
    const browser = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zones.includes(browser)) return browser;
  }

  return zones.includes("UTC") ? "UTC" : zones[0] ?? "UTC";
}
