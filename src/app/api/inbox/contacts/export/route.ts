import { NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/api/require-session";
import { exportAppContactsCsv } from "@/lib/contacts/app-contacts";

export async function GET() {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const csv = await exportAppContactsCsv(auth.userId);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contacts.csv"',
    },
  });
}
