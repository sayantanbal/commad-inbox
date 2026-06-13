import type { CorsairInstance } from "@/lib/corsair";
import { getClassificationsForUser } from "@/lib/corsair/classifications";
import { buildGmailSearchQuery } from "@/lib/search/gmail-query";
import type { SearchHit } from "@/lib/search/semantic";
import type { TriageLane } from "@/lib/types";

export type AdvancedSearchFilters = {
  query?: string;
  sender?: string;
  after?: string;
  before?: string;
  hasAttachment?: boolean;
  lane?: TriageLane;
  limit?: number;
};

export async function advancedSearch(
  userId: string,
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  filters: AdvancedSearchFilters
): Promise<SearchHit[]> {
  const limit = filters.limit ?? 30;
  const q = buildGmailSearchQuery(filters);

  const listed = await tenant.gmail.api.threads.list({
    q: q || undefined,
    maxResults: Math.min(limit * 2, 50),
  });

  const threadIds =
    listed.threads?.map((thread) => thread.id).filter((id): id is string => Boolean(id)) ?? [];

  if (threadIds.length === 0) {
    return [];
  }

  const classifications = await getClassificationsForUser(userId);
  const byThreadId = new Map(classifications.map((row) => [row.threadId, row]));
  const snippetById = new Map(
    (listed.threads ?? [])
      .filter((thread) => thread.id)
      .map((thread) => [thread.id as string, thread.snippet ?? ""])
  );

  const hits: SearchHit[] = [];

  for (const threadId of threadIds) {
    const classification = byThreadId.get(threadId);
    const lane = classification?.lane ?? "reply";

    if (filters.lane && lane !== filters.lane) {
      continue;
    }

    hits.push({
      threadId,
      subject: classification?.subject ?? snippetById.get(threadId)?.slice(0, 80) ?? "(No subject)",
      sender: classification?.sender ?? "Unknown",
      snippet: classification?.snippet ?? snippetById.get(threadId) ?? "",
      lane,
      priority: classification?.priority ?? "medium",
      score: 0,
    });

    if (hits.length >= limit) {
      break;
    }
  }

  return hits;
}
