import { NextResponse } from "next/server";
import { generateOAuthUrl } from "corsair/oauth";
import type { CorsairPluginId } from "@/lib/corsair/connection";
import { corsair } from "@/lib/corsair";
import { getAppUrl } from "@/lib/env";
import { buildCorsairRedirectUri, OAUTH_STATE_COOKIE } from "@/lib/corsair/oauth-url";

export { OAUTH_STATE_COOKIE } from "@/lib/corsair/oauth-url";

export function getCorsairRedirectUri(): string {
  return buildCorsairRedirectUri(getAppUrl());
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
