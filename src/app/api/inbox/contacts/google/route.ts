import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import {
  disconnectGoogleContactsForUser,
  getGoogleContactsConnectionStatus,
  syncGoogleContactsForUser,
} from "@/lib/contacts/google-contacts-connection";
import { googleContactsDisconnectBodySchema } from "@/lib/schemas/api";

export async function GET() {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const status = await getGoogleContactsConnectionStatus(auth.userId);
  return NextResponse.json(status);
}

export async function POST() {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  try {
    const result = await syncGoogleContactsForUser(auth.userId);
    const status = await getGoogleContactsConnectionStatus(auth.userId);
    return NextResponse.json({ ...result, ...status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, googleContactsDisconnectBodySchema, {
    allowEmpty: true,
  });
  if (!parsed.ok) return parsed.response;

  const removeImported = parsed.data.removeImported ?? false;
  const result = await disconnectGoogleContactsForUser(auth.userId, { removeImported });
  return NextResponse.json({ success: true, ...result });
}
