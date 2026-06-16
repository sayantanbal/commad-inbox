import "server-only";

import {
  fetchPeopleConnectionsPage,
  getGmailAccessToken,
  GoogleProxyError,
  type PeopleConnection,
} from "@/lib/corsair/google-proxy";
import type { CorsairInstance } from "@/lib/corsair";
import { upsertAppContacts, type ParsedContactInput } from "@/lib/contacts/app-contacts";

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
    const page = await fetchPeopleConnectionsPage(accessToken, pageToken);
    contacts.push(...parseConnections(page.connections));
    pageToken = page.nextPageToken;
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
  const token = await getGmailAccessToken(tenant);
  try {
    return await importGoogleContactsWithToken(userId, token);
  } catch (error) {
    if (error instanceof GoogleProxyError && error.status === 403) {
      throw new Error(
        "Google Contacts access denied. Connect Google Contacts to grant read-only access."
      );
    }
    throw error;
  }
}
