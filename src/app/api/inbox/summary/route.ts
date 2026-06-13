import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { generateThreadSummary, getCachedThreadSummary, saveThreadSummary } from "@/lib/ai/thread-summary";
import { getClassificationsForUser } from "@/lib/corsair/classifications";
import { mapGmailThread } from "@/lib/corsair/gmail-parse";
import { assertPhase2Env } from "@/lib/env";
import { threadSummaryBodySchema } from "@/lib/schemas/api";

export async function GET(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const threadId = new URL(request.url).searchParams.get("threadId");
  const messageCount = Number(new URL(request.url).searchParams.get("messageCount") ?? "0");
  if (!threadId) {
    return NextResponse.json({ error: "threadId is required" }, { status: 400 });
  }

  const cached = await getCachedThreadSummary(auth.userId, threadId, messageCount);
  if (!cached) {
    return NextResponse.json({ cached: false });
  }

  return NextResponse.json({ cached: true, summary: cached });
}

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  try {
    assertPhase2Env();
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI not configured";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const parsed = await parseJsonBody(request, threadSummaryBodySchema);
  if (!parsed.ok) return parsed.response;

  const { threadId, provider } = parsed.data;

  try {
    const full = await auth.tenant.gmail.api.threads.get({ id: threadId, format: "full" });
    const thread = mapGmailThread(full);
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const cached = await getCachedThreadSummary(auth.userId, threadId, thread.messages.length);
    if (cached) {
      return NextResponse.json({ summary: cached, source: "cache" });
    }

    const classifications = await getClassificationsForUser(auth.userId);
    const classification = classifications.find((c) => c.threadId === threadId);

    const { summary, provider: used } = await generateThreadSummary(
      thread,
      classification,
      provider
    );

    await saveThreadSummary(auth.userId, threadId, thread.messages.length, summary, used);

    return NextResponse.json({ summary, source: "ai", provider: used });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Summary failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
