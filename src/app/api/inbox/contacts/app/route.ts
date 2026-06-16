import { NextRequest, NextResponse } from "next/server";
import { requireSessionApi } from "@/lib/api/require-session";
import { listAppContactsPaginated } from "@/lib/contacts/app-contacts";

export async function GET(request: NextRequest) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const params = request.nextUrl.searchParams;
  const page = Number(params.get("page") ?? "1");
  const pageSize = Number(params.get("pageSize") ?? "20");
  const search = params.get("q") ?? undefined;

  const result = await listAppContactsPaginated(auth.userId, { page, pageSize, search });
  return NextResponse.json(result);
}
