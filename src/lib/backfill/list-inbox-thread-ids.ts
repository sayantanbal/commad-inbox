import type { CorsairInstance } from "@/lib/corsair";

const PAGE_SIZE = 100;

type ThreadsListResponse = {
  threads?: Array<{ id?: string | null }>;
  nextPageToken?: string | null;
};

type ThreadsListParams = {
  labelIds: string[];
  maxResults: number;
  pageToken?: string;
};

/** Paginate all INBOX thread ids via Corsair Gmail API. */
export async function listAllInboxThreadIds(
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  options?: { maxThreads?: number }
): Promise<string[]> {
  const maxThreads = options?.maxThreads ?? 5_000;
  const ids: string[] = [];
  let pageToken: string | undefined;

  do {
    const params: ThreadsListParams = {
      labelIds: ["INBOX"],
      maxResults: PAGE_SIZE,
    };
    if (pageToken) {
      params.pageToken = pageToken;
    }

    const response = (await tenant.gmail.api.threads.list(
      params as Parameters<
        ReturnType<CorsairInstance["withTenant"]>["gmail"]["api"]["threads"]["list"]
      >[0]
    )) as ThreadsListResponse;

    for (const thread of response.threads ?? []) {
      if (thread.id) {
        ids.push(thread.id);
      }
      if (ids.length >= maxThreads) {
        console.warn(
          `[index] inbox thread cap reached (${maxThreads}) — remaining threads skipped`
        );
        return ids;
      }
    }

    pageToken = response.nextPageToken ?? undefined;
  } while (pageToken);

  return ids;
}
