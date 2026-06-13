import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { corsair } from "@/lib/corsair";
import { isTenantFullyConnected } from "@/lib/corsair/connection";

export async function requireSessionApi() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const connected = await isTenantFullyConnected(session.user.id);
  if (!connected) {
    return { error: NextResponse.json({ error: "Google not connected" }, { status: 403 }) };
  }

  return {
    session,
    userId: session.user.id,
    userEmail: session.user.email,
    tenant: corsair.withTenant(session.user.id),
  };
}
