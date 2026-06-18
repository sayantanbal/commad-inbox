import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { enforceUserRateLimit } from "@/lib/api/user-rate-limit";
import { requireSessionApi } from "@/lib/api/require-session";
import { isAllowedMimeType } from "@/lib/gmail/attachment-limits";
import { stageThreadAttachment } from "@/lib/gmail/outbound-attachment";
import { outboundAttachmentFromThreadBodySchema } from "@/lib/schemas/api";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const rateLimited = await enforceUserRateLimit(
    request,
    auth.userId,
    "outbound-attachment"
  );
  if (rateLimited) return rateLimited;

  const parsed = await parseJsonBody(request, outboundAttachmentFromThreadBodySchema);
  if (!parsed.ok) return parsed.response;

  if (!isAllowedMimeType(parsed.data.mimeType)) {
    return NextResponse.json(
      { error: "File type is not supported for native Gmail attachments." },
      { status: 400 }
    );
  }

  try {
    const stored = await stageThreadAttachment(auth.userId, auth.tenant, parsed.data);
    return NextResponse.json(stored);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not stage attachment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
