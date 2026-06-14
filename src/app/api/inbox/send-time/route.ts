import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { mapGmailThread } from "@/lib/corsair/gmail-parse";
import { suggestSendTime } from "@/lib/send-time/suggest";
import { sendTimeSuggestBodySchema } from "@/lib/schemas/api";
import { getUserPreferences } from "@/lib/focus/window";

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, sendTimeSuggestBodySchema);
  if (!parsed.ok) return parsed.response;

  const prefs = await getUserPreferences(auth.userId);
  let messages: Parameters<typeof suggestSendTime>[0] = [];

  if (parsed.data.threadId) {
    const full = await auth.tenant.gmail.api.threads.get({
      id: parsed.data.threadId,
      format: "full",
    });
    const thread = mapGmailThread(full);
    messages = thread?.messages ?? [];
  }

  const suggestion = suggestSendTime(messages, auth.userEmail, prefs.timezone);
  return NextResponse.json({ suggestion });
}
