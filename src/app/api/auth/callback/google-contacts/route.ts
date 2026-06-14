import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GOOGLE_CONTACTS_STATE_COOKIE } from "@/lib/contacts/google-contacts-oauth";
import { importGoogleContactsWithToken } from "@/lib/contacts/google-contacts";
import { env, getAppUrl } from "@/lib/env";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookie = request.cookies.get(GOOGLE_CONTACTS_STATE_COOKIE)?.value;

  if (!code || !state || !cookie) {
    return NextResponse.redirect(
      new URL("/onboarding/contacts?error=oauth_failed", request.url)
    );
  }

  const [expectedState, returnTo] = cookie.split(":");
  if (state !== expectedState) {
    return NextResponse.redirect(
      new URL("/onboarding/contacts?error=invalid_state", request.url)
    );
  }

  const appUrl = getAppUrl();
  const redirectUri = `${appUrl}/api/auth/callback/google-contacts`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(
      new URL("/onboarding/contacts?error=token_exchange", request.url)
    );
  }

  const tokenPayload = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenPayload.access_token) {
    return NextResponse.redirect(
      new URL("/onboarding/contacts?error=missing_token", request.url)
    );
  }

  try {
    const result = await importGoogleContactsWithToken(session.user.id, tokenPayload.access_token);
    const destination = new URL(returnTo || "/onboarding/summary", request.url);
    destination.searchParams.set("contacts", "google");
    destination.searchParams.set("count", String(result.imported));
    const response = NextResponse.redirect(destination);
    response.cookies.delete(GOOGLE_CONTACTS_STATE_COOKIE);
    return response;
  } catch {
    const response = NextResponse.redirect(
      new URL("/onboarding/contacts?error=import_failed", request.url)
    );
    response.cookies.delete(GOOGLE_CONTACTS_STATE_COOKIE);
    return response;
  }
}
