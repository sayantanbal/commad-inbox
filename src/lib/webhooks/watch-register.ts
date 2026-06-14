import { parseGoogleWatchResponse } from "@/lib/schemas/webhooks";

export async function registerGmailWatch(
  accessToken: string,
  topicName: string
): Promise<{ expiration: Date | null; raw: unknown }> {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/watch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topicName,
      labelIds: ["INBOX"],
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Gmail watch failed (${response.status}): ${body}`);
  }

  const parsed = parseGoogleWatchResponse(body);
  return { expiration: parsed.expiration, raw: parsed.raw };
}

export async function registerCalendarWatch(
  accessToken: string,
  webhookUrl: string,
  channelId: string
): Promise<{ expiration: Date | null; raw: unknown }> {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events/watch",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: channelId,
        type: "web_hook",
        address: webhookUrl,
        params: { ttl: "604800" },
      }),
    }
  );

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Calendar watch failed (${response.status}): ${body}`);
  }

  const parsed = parseGoogleWatchResponse(body);
  return { expiration: parsed.expiration, raw: parsed.raw };
}
