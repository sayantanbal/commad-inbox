import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GOOGLE_CONTACTS_STATE_COOKIE } from "@/lib/contacts/google-contacts-oauth";
import {
  getGoogleContactsConnectionStatus,
  markGoogleContactsSynced,
  saveGoogleContactsConnection,
} from "@/lib/contacts/google-contacts-connection";
import { importGoogleContactsWithToken } from "@/lib/contacts/google-contacts";
import { exchangeGoogleOAuthCode } from "@/lib/corsair/google-proxy";
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

  const appUrl = getAppUrl(request);
  const redirectUri = `${appUrl}/api/auth/callback/google-contacts`;

  try {
    const tokenPayload = await exchangeGoogleOAuthCode({
      code,
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    });

    if (tokenPayload.refresh_token) {
      await saveGoogleContactsConnection(session.user.id, tokenPayload.refresh_token);
    }

    const destination = new URL(returnTo || "/onboarding/summary", request.url);
    const connectionStatus = await getGoogleContactsConnectionStatus(session.user.id);

    if (!connectionStatus.connected) {
      const result = await importGoogleContactsWithToken(
        session.user.id,
        tokenPayload.access_token
      );
      await markGoogleContactsSynced(session.user.id);

      if (destination.pathname === "/inbox") {
        destination.searchParams.set("openSettings", "contacts");
        destination.searchParams.set("googleContacts", "connected");
        destination.searchParams.set("count", String(result.imported));
      } else {
        destination.searchParams.set("contacts", "google");
        destination.searchParams.set("count", String(result.imported));
      }
    } else if (destination.pathname === "/inbox") {
      destination.searchParams.set("openSettings", "contacts");
      destination.searchParams.set("googleContacts", "pending");
    } else {
      destination.searchParams.set("contacts", "google");
      destination.searchParams.set("import", "pending");
    }
    const response = NextResponse.redirect(destination);
    response.cookies.delete(GOOGLE_CONTACTS_STATE_COOKIE);
    return response;
  } catch (error) {
    console.error("[google-contacts] oauth callback failed", error);
    const fallback = returnTo?.startsWith("/inbox")
      ? "/inbox?openSettings=contacts&googleContacts=error"
      : "/onboarding/contacts?error=oauth_failed";
    const response = NextResponse.redirect(new URL(fallback, request.url));
    response.cookies.delete(GOOGLE_CONTACTS_STATE_COOKIE);
    return response;
  }
}
