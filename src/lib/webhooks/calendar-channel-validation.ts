export function validateCalendarWebhookChannel(
  expectedToken: string | null | undefined,
  channelToken: string | null,
  expectedChannelId: string | null | undefined,
  channelId: string | null
): { ok: true } | { ok: false; status: number; message: string } {
  if (!expectedToken) {
    return {
      ok: false,
      status: 503,
      message: "Calendar watch not configured — renew watches for this tenant",
    };
  }

  if (!channelToken || channelToken !== expectedToken) {
    return { ok: false, status: 401, message: "Invalid channel token" };
  }

  if (expectedChannelId && channelId && channelId !== expectedChannelId) {
    return { ok: false, status: 401, message: "Invalid channel id" };
  }

  return { ok: true };
}
