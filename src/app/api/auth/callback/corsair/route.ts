import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { processOAuthCallback } from "corsair/oauth";
import { auth } from "@/lib/auth";
import { corsair } from "@/lib/corsair";
import { isPluginConnected, isTenantFullyConnected } from "@/lib/corsair/connection";
import {
  getCorsairRedirectUri,
  OAUTH_STATE_COOKIE,
  startPluginOAuth,
} from "@/lib/corsair/oauth";
import { triggerInboxBackfill } from "@/lib/backfill/inbox-backfill";
import { isBackfillComplete } from "@/lib/users/backfill-status";
import { getOnboardingRedirectPath } from "@/lib/onboarding/status";
import { renewWatchesForTenant } from "@/lib/webhooks/renew-watches";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/onboarding/connect?error=missing_oauth_params", request.url)
    );
  }

  const cookieState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (cookieState && cookieState !== state) {
    return NextResponse.redirect(
      new URL("/onboarding/connect?error=invalid_oauth_state", request.url)
    );
  }

  const redirectUri = getCorsairRedirectUri(request);

  try {
    const result = await processOAuthCallback(corsair, {
      code,
      state,
      redirectUri,
    });

    if (result.tenantId !== session.user.id) {
      return NextResponse.redirect(
        new URL("/onboarding/connect?error=tenant_mismatch", request.url)
      );
    }

    if (result.plugin === "gmail") {
      const calendarConnected = await isPluginConnected(result.tenantId, "googlecalendar");
      if (!calendarConnected) {
        return startPluginOAuth(result.tenantId, "googlecalendar", request);
      }
    }

    if (await isTenantFullyConnected(result.tenantId)) {
      if (!(await isBackfillComplete(result.tenantId))) {
        triggerInboxBackfill(result.tenantId);
      }
      void renewWatchesForTenant(result.tenantId, { force: true }).catch((error) => {
        console.error("[oauth] watch renewal failed", error);
      });
      const redirectPath = await getOnboardingRedirectPath(result.tenantId);
      const response = NextResponse.redirect(new URL(redirectPath, request.url));
      response.cookies.delete(OAUTH_STATE_COOKIE);
      return response;
    }

    const response = NextResponse.redirect(new URL("/onboarding/connect", request.url));
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "oauth_failed";
    const response = NextResponse.redirect(
      new URL(`/onboarding/connect?error=${encodeURIComponent(message)}`, request.url)
    );
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  }
}
