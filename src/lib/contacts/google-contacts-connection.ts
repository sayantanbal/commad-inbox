import "server-only";

import { eq } from "drizzle-orm";
import { encryptSecret, decryptSecret } from "@/lib/ai/crypto";
import { GoogleProxyError, refreshGoogleAccessToken } from "@/lib/corsair/google-proxy";
import { importGoogleContactsWithToken } from "@/lib/contacts/google-contacts";
import { removeGoogleSourceContacts } from "@/lib/contacts/app-contacts";
import { db } from "@/lib/db";
import { googleContactsConnections } from "@/lib/db/schema";
import { env } from "@/lib/env";

export type GoogleContactsConnectionStatus = {
  connected: boolean;
  lastSyncedAt: string | null;
  connectedAt: string | null;
};

export async function getGoogleContactsConnectionStatus(
  userId: string
): Promise<GoogleContactsConnectionStatus> {
  const [row] = await db
    .select()
    .from(googleContactsConnections)
    .where(eq(googleContactsConnections.userId, userId))
    .limit(1);

  if (!row) {
    return { connected: false, lastSyncedAt: null, connectedAt: null };
  }

  return {
    connected: true,
    lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
    connectedAt: row.connectedAt.toISOString(),
  };
}

export async function saveGoogleContactsConnection(
  userId: string,
  refreshToken: string
): Promise<void> {
  const encryptedRefreshToken = encryptSecret(refreshToken);
  const now = new Date();

  await db
    .insert(googleContactsConnections)
    .values({
      userId,
      encryptedRefreshToken,
      connectedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: googleContactsConnections.userId,
      set: {
        encryptedRefreshToken,
        updatedAt: now,
      },
    });
}

export async function markGoogleContactsSynced(userId: string): Promise<void> {
  const now = new Date();
  await db
    .update(googleContactsConnections)
    .set({ lastSyncedAt: now, updatedAt: now })
    .where(eq(googleContactsConnections.userId, userId));
}

export async function getGoogleContactsAccessToken(userId: string): Promise<string> {
  const [row] = await db
    .select()
    .from(googleContactsConnections)
    .where(eq(googleContactsConnections.userId, userId))
    .limit(1);

  if (!row) {
    throw new Error("Google Contacts is not connected");
  }

  let refreshToken: string;
  try {
    refreshToken = decryptSecret(row.encryptedRefreshToken);
  } catch {
    throw new Error("Google Contacts credentials are invalid. Reconnect to continue syncing.");
  }

  try {
    const tokens = await refreshGoogleAccessToken({
      refreshToken,
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    });
    return tokens.access_token;
  } catch (error) {
    if (error instanceof GoogleProxyError && (error.status === 400 || error.status === 401)) {
      throw new Error("Google Contacts access expired. Reconnect to continue syncing.");
    }
    throw error;
  }
}

export async function syncGoogleContactsForUser(
  userId: string
): Promise<{ imported: number; skipped: number; total: number }> {
  const accessToken = await getGoogleContactsAccessToken(userId);
  const result = await importGoogleContactsWithToken(userId, accessToken);
  await markGoogleContactsSynced(userId);
  return result;
}

export async function disconnectGoogleContactsForUser(
  userId: string,
  options: { removeImported: boolean }
): Promise<{ removedContacts: number }> {
  let removedContacts = 0;
  if (options.removeImported) {
    removedContacts = await removeGoogleSourceContacts(userId);
  }

  await db
    .delete(googleContactsConnections)
    .where(eq(googleContactsConnections.userId, userId));

  return { removedContacts };
}
