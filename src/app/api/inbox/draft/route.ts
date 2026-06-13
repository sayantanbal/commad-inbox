import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { generateReplyDraft } from "@/lib/ai/drafts";
import { getDefaultProvider } from "@/lib/ai/with-fallback";
import { assertPhase2Env } from "@/lib/env";
import { mapGmailThread } from "@/lib/corsair/gmail-parse";
import { draftBodySchema } from "@/lib/schemas/api";

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  try {
    assertPhase2Env();
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI not configured";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const parsed = await parseJsonBody(request, draftBodySchema);
  if (!parsed.ok) return parsed.response;

  try {
    const full = await auth.tenant.gmail.api.threads.get({
      id: parsed.data.threadId,
      format: "full",
    });
    const thread = mapGmailThread(full);
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const { draftHtml, source } = await generateReplyDraft({
      thread,
      tone: parsed.data.tone,
      provider: parsed.data.provider ?? getDefaultProvider(),
    });
    return NextResponse.json({ draftHtml, source });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Draft generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
