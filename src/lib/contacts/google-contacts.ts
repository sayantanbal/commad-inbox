import "server-only";

import type { CorsairInstance } from "@/lib/corsair";
import { upsertAppContacts, type ParsedContactInput } from "@/lib/contacts/app-contacts";

interface PeopleConnection {
  names?: Array<{ displayName?: string }>;
  emailAddresses?: Array<{ value?: string }>;
}

interface PeopleConnectionsResponse {
  connections?: PeopleConnection[];
  nextPageToken?: string;
}

function parseConnections(connections: PeopleConnection[]): ParsedContactInput[] {
  const contacts: ParsedContactInput[] = [];

  for (const person of connections) {
    const displayName = person.names?.[0]?.displayName;
    for (const address of person.emailAddresses ?? []) {
      const email = address.value?.trim().toLowerCase();
      if (!email || !email.includes("@")) continue;
      contacts.push({ email, displayName: displayName ?? undefined });
    }
  }

  return contacts;
}

export async function importGoogleContactsWithToken(
  userId: string,
  accessToken: string
): Promise<{ imported: number; skipped: number; total: number }> {
  const contacts: ParsedContactInput[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      personFields: "names,emailAddresses",
      pageSize: "1000",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const response = await fetch(
      `https://people.googleapis.com/v1/people/me/connections?${params}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (response.status === 403) {
      throw new Error(
        "Google Contacts access denied. Connect Google Contacts to grant read-only access."
      );
    }

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Google Contacts import failed (${response.status}): ${detail.slice(0, 200)}`);
    }

    const payload = (await response.json()) as PeopleConnectionsResponse;
    contacts.push(...parseConnections(payload.connections ?? []));
    pageToken = payload.nextPageToken;
  } while (pageToken);

  if (contacts.length === 0) {
    return { imported: 0, skipped: 0, total: 0 };
  }

  const result = await upsertAppContacts(userId, contacts, "google");
  return { ...result, total: contacts.length };
}

export async function importFromGoogleContacts(
  userId: string,
  tenant: ReturnType<CorsairInstance["withTenant"]>
): Promise<{ imported: number; skipped: number; total: number }> {
  const token = await tenant.gmail.keys.get_access_token();
  if (!token) {
    throw new Error("Google access token unavailable");
  }
  return importGoogleContactsWithToken(userId, token);
}
