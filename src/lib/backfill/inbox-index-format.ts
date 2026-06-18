export type InboxIndexStatus = {
  quickBackfillComplete: boolean;
  fullIndexComplete: boolean;
  indexedCount: number;
  inboxTotalThreads: number | null;
  remainingThreads: number;
};

export function formatFullIndexBannerDetail(status: InboxIndexStatus): string {
  if (status.fullIndexComplete && status.indexedCount > 0) {
    return `${status.indexedCount} threads indexed for semantic search`;
  }
  if (status.inboxTotalThreads != null && status.remainingThreads > 0) {
    return `Indexing ${status.remainingThreads} more threads… (${status.indexedCount}/${status.inboxTotalThreads})`;
  }
  if (status.inboxTotalThreads != null) {
    return `Indexing inbox for search… (${status.indexedCount}/${status.inboxTotalThreads})`;
  }
  return "Indexing older threads for search…";
}
