import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PeoplePageClient } from "./people-client";
import { auth } from "@/lib/auth";
import { isTenantFullyConnected } from "@/lib/corsair/connection";

export default async function PeoplePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const connected = await isTenantFullyConnected(session.user.id);
  if (!connected) redirect("/onboarding/connect");

  return <PeoplePageClient />;
}
