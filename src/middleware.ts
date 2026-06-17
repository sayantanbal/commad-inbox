import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PROTECTED_PREFIXES = ["/inbox", "/onboarding"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);
  const isAuthenticated = Boolean(sessionCookie);

  if (isProtectedPath(pathname) && !isAuthenticated) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Do not redirect /sign-in → /onboarding/connect from cookie presence alone.
  // A stale session cookie + failed getSession() caused an infinite redirect loop.

  return NextResponse.next();
}

export const config = {
  matcher: ["/inbox/:path*", "/onboarding/:path*", "/sign-in"],
};
