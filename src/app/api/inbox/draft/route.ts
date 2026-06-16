import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { enforceUserRateLimit } from "@/lib/api/user-rate-limit";
import { generateReplyDraft } from "@/lib/ai/drafts";
import { assertAiAvailable } from "@/lib/ai/runtime";
import { getDefaultProvider } from "@/lib/ai/with-fallback";
import { aiErrorResponse } from "@/lib/api/ai-error-response";
import { mapGmailThread } from "@/lib/corsair/gmail-parse";
import { draftBodySchema } from "@/lib/schemas/api";

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const rateLimited = enforceUserRateLimit(auth.userId, "inbox-draft");
  if (rateLimited) return rateLimited;

  try {
    await assertAiAvailable(auth.userId);
  } catch (error) {
    const response = aiErrorResponse(error);
    if (response) return response;
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

    const defaultProvider = await getDefaultProvider(auth.userId);
    const { draftHtml, source } = await generateReplyDraft({
      userId: auth.userId,
      thread,
      tone: parsed.data.tone,
      provider: parsed.data.provider ?? defaultProvider,
    });
    return NextResponse.json({ draftHtml, source });
  } catch (error) {
    const response = aiErrorResponse(error);
    if (response) return response;
    const message = error instanceof Error ? error.message : "Draft generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
