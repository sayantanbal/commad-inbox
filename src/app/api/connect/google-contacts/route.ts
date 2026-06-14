import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isTenantFullyConnected } from "@/lib/corsair/connection";
import { GOOGLE_CONTACTS_STATE_COOKIE } from "@/lib/contacts/google-contacts-oauth";
import { env, getAppUrl } from "@/lib/env";

const CONTACTS_SCOPE = "https://www.googleapis.com/auth/contacts.readonly";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const connected = await isTenantFullyConnected(session.user.id);
  if (!connected) {
    return NextResponse.redirect(new URL("/onboarding/connect", request.url));
  }

  const appUrl = getAppUrl();
  const redirectUri = `${appUrl}/api/auth/callback/google-contacts`;
  const state = randomBytes(24).toString("hex");
  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/onboarding/summary?contacts=google";

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: ["openid", "email", "profile", CONTACTS_SCOPE].join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
    include_granted_scopes: "true",
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
  response.cookies.set(GOOGLE_CONTACTS_STATE_COOKIE, `${state}:${returnTo}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
