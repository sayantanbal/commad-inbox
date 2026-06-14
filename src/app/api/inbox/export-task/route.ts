import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { mapGmailThread } from "@/lib/corsair/gmail-parse";
import {
  createLinearIssue,
  getLinearConnection,
  linkThreadExternalTask,
} from "@/lib/integrations/linear";
import { exportTaskBodySchema } from "@/lib/schemas/api";

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, exportTaskBodySchema);
  if (!parsed.ok) return parsed.response;

  const conn = await getLinearConnection(auth.userId);
  if (!conn?.accessToken) {
    return NextResponse.json({ error: "Linear not connected" }, { status: 403 });
  }

  const teamId = parsed.data.teamId ?? conn.teamId;
  if (!teamId) {
    return NextResponse.json({ error: "Linear team ID required" }, { status: 400 });
  }

  const issue = await createLinearIssue({
    accessToken: conn.accessToken,
    teamId,
    title: parsed.data.title,
    description: parsed.data.description,
    projectId: parsed.data.projectId ?? conn.defaultProjectId ?? undefined,
  });

  await linkThreadExternalTask(auth.userId, parsed.data.threadId, issue.id, issue.url);
  return NextResponse.json({ task: issue });
}

export async function GET() {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const conn = await getLinearConnection(auth.userId);
  return NextResponse.json({
    connected: Boolean(conn),
    teamId: conn?.teamId ?? null,
  });
}
