import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isKekMismatchError } from "@/lib/corsair/errors";
import { startPluginOAuth } from "@/lib/corsair/oauth";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  try {
    return await startPluginOAuth(session.user.id, "gmail", request);
  } catch (error) {
    if (isKekMismatchError(error)) {
      return NextResponse.redirect(
        new URL("/onboarding/connect?error=kek_mismatch", request.url)
      );
    }
    throw error;
  }
}
