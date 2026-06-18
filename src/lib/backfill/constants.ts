/** Recent threads classified first so lanes work immediately on connect. */
export const QUICK_BACKFILL_LIMIT = 50;

/** Threads shown in inbox list / API fetch (decoupled from quick backfill). */
export const INBOX_LIST_LIMIT = 150;

/** @deprecated Use QUICK_BACKFILL_LIMIT */
export const BACKFILL_THREAD_LIMIT = QUICK_BACKFILL_LIMIT;

export const CLASSIFICATION_COVERAGE_THRESHOLD = 0.5;

/** Safety cap when paginating very large inboxes. */
export const FULL_INBOX_INDEX_MAX_THREADS = 5_000;

/** Pause between classify calls to respect AI provider quotas. */
export const CLASSIFY_BATCH_DELAY_MS = 400;
