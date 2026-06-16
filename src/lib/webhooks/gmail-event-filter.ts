type GmailWebhookEvent = {
  type?: string;
  message?: { threadId?: string };
};

/** Pure helper — safe to import from unit tests (no server-only deps). */
export function shouldClassifyGmailEvent(body: unknown): boolean {
  const event = body as GmailWebhookEvent;
  return event.type === "messageReceived" && Boolean(event.message?.threadId);
}
