import { NextResponse } from "next/server";
import { generateOAuthUrl } from "corsair/oauth";
import type { CorsairPluginId } from "@/lib/corsair/connection";
import { corsair } from "@/lib/corsair";
import { getAppUrl } from "@/lib/env";

export const OAUTH_STATE_COOKIE = "oauth_state";

export function getCorsairRedirectUri(): string {
  return `${getAppUrl()}/api/auth/callback/corsair`;
}

export async function startPluginOAuth(
  tenantId: string,
  pluginId: CorsairPluginId
): Promise<NextResponse> {
  const redirectUri = getCorsairRedirectUri();
  const { url, state } = await generateOAuthUrl(corsair, pluginId, {
    tenantId,
    redirectUri,
  });

  const response = NextResponse.redirect(url);
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
