/** Calendar push webhooks require a publicly reachable HTTPS URL. */

export function canRegisterCalendarWatch(appUrl: string): boolean {
  try {
    return new URL(appUrl).protocol === "https:";
  } catch {
    return false;
  }
}

export function buildCalendarWebhookUrl(appUrl: string, tenantId: string): string {
  return `${appUrl.replace(/\/$/, "")}/api/webhooks/calendar?tenantId=${encodeURIComponent(tenantId)}`;
}

export function calendarWatchSkipReason(appUrl: string): string {
  return (
    `Calendar watch skipped: Google requires HTTPS webhook URL (APP_URL is ${appUrl}). ` +
    "For local dev, run ngrok http 3000 and set APP_URL to the https://… ngrok URL, then re-run."
  );
}
