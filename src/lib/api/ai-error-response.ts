import { NextResponse } from "next/server";
import { AiNotConfiguredError, AI_NOT_CONFIGURED_MESSAGE } from "@/lib/ai/runtime";

export function aiErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof AiNotConfiguredError) {
    return NextResponse.json({ error: AI_NOT_CONFIGURED_MESSAGE }, { status: 503 });
  }
  return null;
}
