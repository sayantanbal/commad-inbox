import { NextResponse } from "next/server";
import { isPlatformProviderConfigured } from "@/lib/ai/models";
import { pgPool } from "@/lib/db/pool";
import { env } from "@/lib/env";
import { isPusherConfigured } from "@/lib/realtime/pusher";

const VERSION = process.env.npm_package_version ?? "0.1.0";

export async function GET() {
  let dbOk = false;

  try {
    await pgPool.query("SELECT 1");
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const integrations = {
    pusher: isPusherConfigured(),
    gmailPubSub: Boolean(env.GMAIL_PUBSUB_TOPIC),
    openai: isPlatformProviderConfigured("openai"),
    gemini: isPlatformProviderConfigured("gemini"),
  };

  const ok =
    dbOk &&
    integrations.pusher &&
    integrations.gmailPubSub &&
    (integrations.openai || integrations.gemini);

  const body = {
    ok,
    db: dbOk ? "up" : "down",
    version: VERSION,
    integrations,
  };

  return NextResponse.json(body, { status: dbOk ? 200 : 503 });
}
