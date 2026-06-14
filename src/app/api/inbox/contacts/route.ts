import { NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/api/require-session";
import { getContactsForUser } from "@/lib/contacts/rebuild";

export async function GET() {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const rows = await getContactsForUser(auth.userId);
  return NextResponse.json({
    contacts: rows.map((row) => ({
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      lastContactAt: row.lastContactAt.toISOString(),
      avgResponseHours: row.avgResponseHours,
      emailCount30d: row.emailCount30d,
      warmth: row.warmth,
      openCommitmentCount: row.openCommitmentCount,
    })),
  });
}
