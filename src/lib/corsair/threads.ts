import { AuthMissingError } from "corsair/core";
import type { CorsairInstance } from "@/lib/corsair";
import { isGmailApiDisabled, toGmailApiDisabledError } from "@/lib/corsair/api-errors";
import { mapGmailThread } from "@/lib/corsair/gmail-parse";
import { INBOX_LIST_LIMIT } from "@/lib/backfill/constants";
import type { Thread } from "@/lib/types";

const THREAD_LIMIT = INBOX_LIST_LIMIT;

function isAuthError(error: unknown): boolean {
  if (error instanceof AuthMissingError) return true;
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("auth-missing") ||
    message.includes("Authentication required") ||
    message.includes("Account not found")
  );
}

export async function fetchThreadsForTenant(
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  options?: { labelIds?: string[]; maxResults?: number }
): Promise<Thread[]> {
  const labelIds = options?.labelIds ?? ["INBOX"];
  const maxResults = options?.maxResults ?? THREAD_LIMIT;
  try {
    const listed = await tenant.gmail.api.threads.list({
      maxResults,
      labelIds,
    });

    const threadIds =
      listed.threads?.map((thread) => thread.id).filter((id): id is string => Boolean(id)) ?? [];

    const threads = await Promise.all(
      threadIds.map(async (id) => {
        const full = await tenant.gmail.api.threads.get({
          id,
          format: "full",
        });
        return mapGmailThread(full);
      })
    );

    return threads
      .filter((thread): thread is Thread => thread !== null)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (error) {
    if (isAuthError(error)) {
      throw error;
    }
    if (isGmailApiDisabled(error)) {
      throw toGmailApiDisabledError(error);
    }
    throw error;
  }
}
