import { NextResponse } from "next/server";
import { fetchThreadsForTenant } from "@/lib/corsair/threads";
import { requireConnectedTenantApi } from "@/lib/corsair/tenant";
import { serializeThreads } from "@/lib/inbox-serialize";

const ALLOWED_LABELS = ["sent", "inbox"] as const;

export async function GET(request: Request) {
  const auth = await requireConnectedTenantApi();
  if ("error" in auth) return auth.error;

  const label = new URL(request.url).searchParams.get("label") ?? "inbox";
  if (!ALLOWED_LABELS.includes(label as (typeof ALLOWED_LABELS)[number])) {
    return NextResponse.json({ error: "Invalid label" }, { status: 400 });
  }

  try {
    const labelIds = label === "sent" ? ["SENT"] : ["INBOX"];
    const threads = await fetchThreadsForTenant(auth.tenant, { labelIds });
    return NextResponse.json({ threads: serializeThreads(threads) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load threads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
