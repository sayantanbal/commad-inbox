import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSessionApi } from "@/lib/api/require-session";
import { snoozeThreadForUser, unsnoozeThreadForUser } from "@/lib/inbox/snoozes";

const bodySchema = z.object({
  threadId: z.string().min(1),
  until: z.string().datetime(),
});

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await snoozeThreadForUser(auth.userId, parsed.data.threadId, new Date(parsed.data.until));
  return NextResponse.json({ success: true });
}

const cancelSchema = z.object({
  threadId: z.string().min(1),
});

export async function DELETE(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = cancelSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await unsnoozeThreadForUser(auth.userId, parsed.data.threadId);
  return NextResponse.json({ success: true });
}
