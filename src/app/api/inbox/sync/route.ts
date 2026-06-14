import { NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/api/require-session";
import { loadInboxDataForUser } from "@/lib/inbox/load-inbox-data";

export async function GET() {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  try {
    const { serialized } = await loadInboxDataForUser(auth.tenant, auth.userId);
    return NextResponse.json(serialized);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inbox sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
