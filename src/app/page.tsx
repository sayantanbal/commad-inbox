import { headers } from "next/headers";
import { LandingPage } from "@/components/home/landing-page";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  return <LandingPage isSignedIn={Boolean(session)} />;
}
