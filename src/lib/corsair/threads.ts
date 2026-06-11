import { AuthMissingError } from "corsair/core";
import type { CorsairInstance } from "@/lib/corsair";
import { isGmailApiDisabled, toGmailApiDisabledError } from "@/lib/corsair/api-errors";
import { mapGmailThread } from "@/lib/corsair/gmail-parse";
import type { Thread } from "@/lib/types";

const THREAD_LIMIT = 50;

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
  tenant: ReturnType<CorsairInstance["withTenant"]>
): Promise<Thread[]> {
  try {
    const listed = await tenant.gmail.api.threads.list({
      maxResults: THREAD_LIMIT,
      labelIds: ["INBOX"],
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
