import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import {
  createSnippet,
  deleteSnippet,
  listSnippetsForUser,
  seedDefaultSnippets,
} from "@/lib/snippets/store";
import { snippetBodySchema, snippetIdBodySchema } from "@/lib/schemas/api";

export async function GET() {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  await seedDefaultSnippets(auth.userId);
  const rows = await listSnippetsForUser(auth.userId);
  return NextResponse.json({
    snippets: rows.map((row) => ({
      id: row.id,
      name: row.name,
      body: row.body,
      variables: row.variables,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, snippetBodySchema);
  if (!parsed.ok) return parsed.response;

  const id = await createSnippet(auth.userId, parsed.data.name, parsed.data.body);
  return NextResponse.json({ id });
}

export async function DELETE(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, snippetIdBodySchema);
  if (!parsed.ok) return parsed.response;

  await deleteSnippet(auth.userId, parsed.data.snippetId);
  return NextResponse.json({ success: true });
}
