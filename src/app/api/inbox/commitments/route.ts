import { NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/api/require-session";
import {
  confirmCommitment,
  getCommitmentsForUser,
  mapCommitmentRow,
  updateCommitmentStatus,
} from "@/lib/commitments/queries";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { commitmentConfirmBodySchema, commitmentPatchBodySchema } from "@/lib/schemas/api";

export async function GET(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const view = url.searchParams.get("view");
  const direction = view === "waiting" ? "inbound" : view === "commitments" ? "outbound" : undefined;

  const rows = await getCommitmentsForUser(auth.userId, {
    direction,
    status: ["open", "pending_confirm"],
  });

  return NextResponse.json({ commitments: rows.map(mapCommitmentRow) });
}

export async function PATCH(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, commitmentPatchBodySchema);
  if (!parsed.ok) return parsed.response;

  await updateCommitmentStatus(auth.userId, parsed.data.commitmentId, parsed.data.status);
  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, commitmentConfirmBodySchema);
  if (!parsed.ok) return parsed.response;

  await confirmCommitment(auth.userId, parsed.data.commitmentId);
  return NextResponse.json({ success: true });
}
