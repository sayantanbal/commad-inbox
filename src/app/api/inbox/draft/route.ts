import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSessionApi } from "@/lib/api/require-session";
import { generateReplyDraft } from "@/lib/ai/drafts";
import { assertPhase2Env } from "@/lib/env";
import { mapGmailThread } from "@/lib/corsair/gmail-parse";

const bodySchema = z.object({
  threadId: z.string().min(1),
  tone: z.enum(["professional", "friendly", "brief"]).default("professional"),
});

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  try {
    assertPhase2Env();
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI not configured";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const full = await auth.tenant.gmail.api.threads.get({
      id: parsed.data.threadId,
      format: "full",
    });
    const thread = mapGmailThread(full);
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const draftHtml = await generateReplyDraft({ thread, tone: parsed.data.tone });
    return NextResponse.json({ draftHtml });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Draft generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
