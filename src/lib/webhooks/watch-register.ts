import { parseGoogleWatchResponse } from "@/lib/schemas/webhooks";
import {
  registerCalendarWatchViaProxy,
  registerGmailWatchViaProxy,
} from "@/lib/corsair/google-proxy";

/** @deprecated Use google-proxy registerGmailWatchViaProxy — kept for script import stability. */
export async function registerGmailWatch(
  accessToken: string,
  topicName: string
): Promise<{ expiration: Date | null; raw: unknown }> {
  const result = await registerGmailWatchViaProxy(accessToken, topicName);
  const parsed = parseGoogleWatchResponse(JSON.stringify(result.raw));
  return { expiration: parsed.expiration ?? result.expiration, raw: parsed.raw };
}

/** @deprecated Use google-proxy registerCalendarWatchViaProxy */
export async function registerCalendarWatch(
  accessToken: string,
  webhookUrl: string,
  channelId: string,
  channelToken: string
): Promise<{ expiration: Date | null; raw: unknown }> {
  const result = await registerCalendarWatchViaProxy(
    accessToken,
    webhookUrl,
    channelId,
    channelToken
  );
  const parsed = parseGoogleWatchResponse(JSON.stringify(result.raw));
  return { expiration: parsed.expiration ?? result.expiration, raw: parsed.raw };
}
