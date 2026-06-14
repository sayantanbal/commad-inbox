import { NextResponse } from "next/server";
import { parseSearchParams } from "@/lib/api/parse-query";
import { requireSessionApi } from "@/lib/api/require-session";
import { generateMeetingBrief } from "@/lib/contacts/rebuild";
import { preBriefQuerySchema } from "@/lib/schemas/api";

export async function GET(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = parseSearchParams(new URL(request.url), preBriefQuerySchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error, issues: parsed.issues }, { status: 400 });
  }

  const brief = await generateMeetingBrief(
    auth.userId,
    auth.tenant,
    parsed.data.attendeeEmail
  );

  return NextResponse.json({ brief });
}
