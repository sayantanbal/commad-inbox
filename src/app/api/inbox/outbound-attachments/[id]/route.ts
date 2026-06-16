import { NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/api/require-session";
import { deleteOutboundAttachment } from "@/lib/gmail/outbound-attachment";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const deleted = await deleteOutboundAttachment(auth.userId, id);
  if (!deleted) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
