import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { dismissContact } from "@/lib/contacts/app-contacts";
import { contactDismissBodySchema } from "@/lib/schemas/api";

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, contactDismissBodySchema);
  if (!parsed.ok) return parsed.response;

  await dismissContact(auth.userId, parsed.data.email);
  return NextResponse.json({ success: true });
}
