import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { snoozeThreadForUser, unsnoozeThreadForUser } from "@/lib/inbox/snoozes";
import { snoozeBodySchema, snoozeCancelBodySchema } from "@/lib/schemas/api";

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, snoozeBodySchema);
  if (!parsed.ok) return parsed.response;

  await snoozeThreadForUser(auth.userId, parsed.data.threadId, new Date(parsed.data.until));
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, snoozeCancelBodySchema);
  if (!parsed.ok) return parsed.response;

  await unsnoozeThreadForUser(auth.userId, parsed.data.threadId);
  return NextResponse.json({ success: true });
}
