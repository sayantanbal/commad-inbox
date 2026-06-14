import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import {
  addAppContact,
  getMergedContactsForUser,
} from "@/lib/contacts/app-contacts";
import { contactBodySchema } from "@/lib/schemas/api";

export async function GET() {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const rows = await getMergedContactsForUser(auth.userId);
  return NextResponse.json({ contacts: rows });
}

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, contactBodySchema);
  if (!parsed.ok) return parsed.response;

  const { id, created } = await addAppContact(auth.userId, parsed.data, "manual");
  return NextResponse.json({ id, created });
}
