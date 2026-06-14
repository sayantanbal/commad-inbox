import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { importFromGmailSent, upsertAppContacts } from "@/lib/contacts/app-contacts";
import { importFromGoogleContacts } from "@/lib/contacts/google-contacts";
import { parseContactFile, parsePlainEmailList } from "@/lib/contacts/import";
import { contactsImportJsonBodySchema } from "@/lib/schemas/api";

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const content = await file.text();
    const contacts = parseContactFile(file.name, content);
    if (contacts.length === 0) {
      return NextResponse.json({ error: "No contacts found in file" }, { status: 400 });
    }

    const result = await upsertAppContacts(auth.userId, contacts, "import");
    return NextResponse.json({ ...result, total: contacts.length });
  }

  const parsed = await parseJsonBody(request, contactsImportJsonBodySchema, { allowEmpty: true });
  if (!parsed.ok) return parsed.response;

  if (parsed.data.source === "gmail-sent") {
    const result = await importFromGmailSent(auth.userId, auth.tenant);
    return NextResponse.json({ ...result, source: "gmail-sent" });
  }

  if (parsed.data.source === "google-contacts") {
    try {
      const result = await importFromGoogleContacts(auth.userId, auth.tenant);
      return NextResponse.json({ ...result, source: "google-contacts" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google Contacts import failed";
      return NextResponse.json({ error: message }, { status: 403 });
    }
  }

  if (parsed.data.emails?.length) {
    const contacts = parsed.data.emails.map((email) => ({ email }));
    const result = await upsertAppContacts(auth.userId, contacts, "import");
    return NextResponse.json({ ...result, total: contacts.length });
  }

  if (parsed.data.text) {
    const contacts = parsePlainEmailList(parsed.data.text);
    if (contacts.length === 0) {
      return NextResponse.json({ error: "No valid emails found" }, { status: 400 });
    }
    const result = await upsertAppContacts(auth.userId, contacts, "import");
    return NextResponse.json({ ...result, total: contacts.length });
  }

  return NextResponse.json({ error: "Provide a file, emails, text, or source" }, { status: 400 });
}
