import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { saveLinearConnection } from "@/lib/integrations/linear";
import { linearConnectBodySchema } from "@/lib/schemas/api";

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, linearConnectBodySchema);
  if (!parsed.ok) return parsed.response;

  await saveLinearConnection(
    auth.userId,
    parsed.data.accessToken,
    parsed.data.teamId,
    parsed.data.defaultProjectId
  );

  return NextResponse.json({ success: true });
}
