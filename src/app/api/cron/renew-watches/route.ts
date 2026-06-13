import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { renewWatchesForAllTenants } from "@/lib/webhooks/renew-watches";

function authorizeCron(request: Request): boolean {
  if (!env.CRON_SECRET) return false;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return token === env.CRON_SECRET;
}

async function handleRenew(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force =
    new URL(request.url).searchParams.get("force") === "1" ||
    new URL(request.url).searchParams.get("force") === "true";

  const results = await renewWatchesForAllTenants({ force });

  return NextResponse.json({
    success: true,
    renewed: results.length,
    results,
  });
}

/** Vercel Cron invokes GET. Manual / CI can use POST. */
export async function GET(request: Request) {
  return handleRenew(request);
}

export async function POST(request: Request) {
  return handleRenew(request);
}
