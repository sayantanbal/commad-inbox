import { NextResponse } from "next/server";
import { parseSearchParams } from "@/lib/api/parse-query";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import {
  deleteUserAiKey,
  getUserAiKeyHints,
  saveUserAiKey,
} from "@/lib/ai/key-store";
import { aiKeyBodySchema, aiKeyDeleteQuerySchema } from "@/lib/schemas/api";
import type { AiProvider } from "@/lib/ai/providers";

export async function GET() {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const status = await getUserAiKeyHints(auth.userId);
  return NextResponse.json(status);
}

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, aiKeyBodySchema);
  if (!parsed.ok) return parsed.response;

  try {
    const saved = await saveUserAiKey(
      auth.userId,
      parsed.data.provider,
      parsed.data.apiKey
    );
    return NextResponse.json({ success: true, key: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save API key";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = parseSearchParams(new URL(request.url), aiKeyDeleteQuerySchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error, issues: parsed.issues }, { status: 400 });
  }

  await deleteUserAiKey(auth.userId, parsed.data.provider as AiProvider);
  const status = await getUserAiKeyHints(auth.userId);
  return NextResponse.json({ success: true, ...status });
}
