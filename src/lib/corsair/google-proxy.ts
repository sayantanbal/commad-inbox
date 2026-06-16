import type { CorsairInstance } from "@/lib/corsair";

export class GoogleProxyError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: string
  ) {
    super(message);
    this.name = "GoogleProxyError";
  }
}

type GoogleProxyFetchParams = {
  accessToken: string;
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

/** Single gateway for Google REST calls using Corsair-issued OAuth tokens. */
export async function googleProxyFetch<T = unknown>(
  params: GoogleProxyFetchParams
): Promise<T> {
  const response = await fetch(params.url, {
    method: params.method ?? "GET",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
      ...params.headers,
    },
    body: params.body != null ? JSON.stringify(params.body) : undefined,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new GoogleProxyError(
      `Google API ${params.method ?? "GET"} failed (${response.status})`,
      response.status,
      text.slice(0, 500)
    );
  }

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new GoogleProxyError("Google API returned invalid JSON", response.status, text.slice(0, 200));
  }
}

export async function getGmailAccessToken(
  tenant: ReturnType<CorsairInstance["withTenant"]>
): Promise<string> {
  const token = await tenant.gmail.keys.get_access_token();
  if (!token) throw new Error("Gmail access token unavailable");
  return token;
}

export async function fetchGmailAttachmentData(
  accessToken: string,
  messageId: string,
  attachmentId: string
): Promise<Buffer> {
  const raw = await googleProxyFetch<{ data?: string; size?: number }>({
    accessToken,
    url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
  });
  if (!raw.data) {
    throw new GoogleProxyError("Gmail attachment not found", 404);
  }
  const normalized = raw.data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64");
}

export async function getCalendarAccessToken(
  tenant: ReturnType<CorsairInstance["withTenant"]>
): Promise<string> {
  const token = await tenant.googlecalendar.keys.get_access_token();
  if (!token) throw new Error("Calendar access token unavailable");
  return token;
}

export async function exchangeGoogleOAuthCode(params: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
  const body = new URLSearchParams({
    code: params.code,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new GoogleProxyError("OAuth token exchange failed", response.status, text.slice(0, 300));
  }

  const payload = JSON.parse(text) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!payload.access_token) {
    throw new GoogleProxyError("OAuth token exchange missing access_token", response.status);
  }

  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_in: payload.expires_in,
  };
}

export async function refreshGoogleAccessToken(params: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<{ access_token: string; expires_in?: number }> {
  const body = new URLSearchParams({
    refresh_token: params.refreshToken,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new GoogleProxyError("OAuth token refresh failed", response.status, text.slice(0, 300));
  }

  const payload = JSON.parse(text) as { access_token?: string; expires_in?: number };
  if (!payload.access_token) {
    throw new GoogleProxyError("OAuth token refresh missing access_token", response.status);
  }

  return {
    access_token: payload.access_token,
    expires_in: payload.expires_in,
  };
}

/** Corsair plugins do not expose native watch APIs — register via Google REST through this gateway. */
export async function registerGmailWatchViaProxy(
  accessToken: string,
  topicName: string
): Promise<{ expiration: Date | null; raw: unknown }> {
  const raw = await googleProxyFetch<{
    expiration?: string;
    historyId?: string;
  }>({
    accessToken,
    url: "https://gmail.googleapis.com/gmail/v1/users/me/watch",
    method: "POST",
    body: {
      topicName,
      labelIds: ["INBOX"],
    },
  });

  const expiration =
    raw.expiration != null ? new Date(Number(raw.expiration)) : null;
  return { expiration, raw };
}

export async function registerCalendarWatchViaProxy(
  accessToken: string,
  webhookUrl: string,
  channelId: string,
  channelToken: string
): Promise<{ expiration: Date | null; raw: unknown }> {
  const raw = await googleProxyFetch<{
    expiration?: string;
    resourceId?: string;
  }>({
    accessToken,
    url: "https://www.googleapis.com/calendar/v3/calendars/primary/events/watch",
    method: "POST",
    body: {
      id: channelId,
      type: "web_hook",
      address: webhookUrl,
      token: channelToken,
      params: { ttl: "604800" },
    },
  });

  const expiration =
    raw.expiration != null ? new Date(Number(raw.expiration)) : null;
  return { expiration, raw };
}

export type PeopleConnection = {
  names?: Array<{ displayName?: string }>;
  emailAddresses?: Array<{ value?: string }>;
};

export async function fetchPeopleConnectionsPage(
  accessToken: string,
  pageToken?: string
): Promise<{ connections: PeopleConnection[]; nextPageToken?: string }> {
  const params = new URLSearchParams({
    personFields: "names,emailAddresses",
    pageSize: "1000",
  });
  if (pageToken) params.set("pageToken", pageToken);

  const raw = await googleProxyFetch<{
    connections?: PeopleConnection[];
    nextPageToken?: string;
  }>({
    accessToken,
    url: `https://people.googleapis.com/v1/people/me/connections?${params}`,
  });

  return {
    connections: raw.connections ?? [],
    nextPageToken: raw.nextPageToken,
  };
}
