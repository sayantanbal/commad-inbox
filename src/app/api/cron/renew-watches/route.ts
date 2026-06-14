import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { renewWatchesForAllTenants } from "@/lib/webhooks/renew-watches";
import { cronForceQuerySchema } from "@/lib/schemas/webhooks";
import { parseSearchParams } from "@/lib/api/parse-query";

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

  const query = parseSearchParams(new URL(request.url), cronForceQuerySchema);
  if (!query.ok) {
    return NextResponse.json({ error: query.error }, { status: 400 });
  }

  const force = query.data.force ?? false;

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
