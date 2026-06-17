import { NextResponse } from "next/server";
import { pgPool } from "@/lib/db/pool";

const VERSION = process.env.npm_package_version ?? "0.1.0";

export async function GET() {
  let dbOk = false;

  try {
    await pgPool.query("SELECT 1");
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const body = {
    ok: dbOk,
    db: dbOk ? "up" : "down",
    version: VERSION,
  };

  return NextResponse.json(body, { status: dbOk ? 200 : 503 });
}
