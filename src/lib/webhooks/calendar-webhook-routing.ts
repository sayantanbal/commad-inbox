/** Pure routing helpers for calendar webhook entry points (unit-testable). */

/** Corsair processWebhook path: googlecalendar.eventChanged → shared calendar sync. */
export function shouldHandleCorsairCalendarEvent(
  plugin: string | null | undefined,
  action: string | null | undefined
): boolean {
  return plugin === "googlecalendar" && action === "eventChanged";
}

/** Google events.watch push: skip channel sync handshake; otherwise enqueue calendar sync. */
export function shouldHandleGoogleCalendarPush(resourceState: string | null): boolean {
  return resourceState !== "sync";
}

/** Both webhook routes delegate calendar changes to this handler. */
export const CALENDAR_SYNC_HANDLER = "handleCalendarEventChanged" as const;
