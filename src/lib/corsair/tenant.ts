import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { corsair } from "@/lib/corsair";
import { isTenantFullyConnected } from "@/lib/corsair/connection";

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}

export async function requireConnectedTenant() {
  const session = await requireSession();
  const connected = await isTenantFullyConnected(session.user.id);
  if (!connected) {
    redirect("/onboarding/connect");
  }
  return {
    session,
    tenant: corsair.withTenant(session.user.id),
    userId: session.user.id,
    userEmail: session.user.email,
  };
}

export function getTenantForUser(userId: string) {
  return corsair.withTenant(userId);
}
