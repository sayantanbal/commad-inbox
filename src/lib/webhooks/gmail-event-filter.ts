type GmailWebhookEvent = {
  type?: string;
  message?: { threadId?: string };
};

/** Whether a Corsair processWebhook result should enqueue Gmail classification. */
export function shouldHandleGmailMessageChanged(plugin: string, action: string): boolean {
  return plugin === "gmail" && action === "messageChanged";
}

/** Pure helper — safe to import from unit tests (no server-only deps). */
export function shouldClassifyGmailEvent(body: unknown): boolean {
  const event = body as GmailWebhookEvent;
  return event.type === "messageReceived" && Boolean(event.message?.threadId);
}

/** Thread id to classify when shouldClassifyGmailEvent is true; otherwise null. */
export function getClassifyThreadIdFromGmailWebhook(body: unknown): string | null {
  if (!shouldClassifyGmailEvent(body)) return null;
  const event = body as GmailWebhookEvent;
  return event.message?.threadId ?? null;
}
