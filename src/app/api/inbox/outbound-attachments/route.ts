import { NextResponse } from "next/server";
import { enforceUserRateLimit } from "@/lib/api/user-rate-limit";
import { requireSessionApi } from "@/lib/api/require-session";
import { isAllowedMimeType, validateSingleAttachmentSize } from "@/lib/gmail/attachment-limits";
import { listOutboundAttachmentMeta, storeOutboundAttachment } from "@/lib/gmail/outbound-attachment";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const idsParam = new URL(request.url).searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 10);

  const attachments = await listOutboundAttachmentMeta(auth.userId, ids);
  return NextResponse.json({ attachments });
}

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const rateLimited = enforceUserRateLimit(auth.userId, "outbound-attachment");
  if (rateLimited) return rateLimited;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const mimeType = file.type || "application/octet-stream";
  if (!isAllowedMimeType(mimeType)) {
    return NextResponse.json(
      { error: "File type is not supported for native Gmail attachments." },
      { status: 400 }
    );
  }

  const data = Buffer.from(await file.arrayBuffer());
  const sizeError = validateSingleAttachmentSize(data.length);
  if (sizeError) {
    return NextResponse.json({ error: sizeError }, { status: 400 });
  }

  try {
    const stored = await storeOutboundAttachment(auth.userId, {
      filename: file.name || "attachment",
      mimeType,
      data,
      source: "upload",
    });
    return NextResponse.json(stored);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
