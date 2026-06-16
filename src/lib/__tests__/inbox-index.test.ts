import { describe, expect, test } from "bun:test";
import { formatFullIndexBannerDetail } from "@/lib/backfill/inbox-index-format";
import {
  FULL_INBOX_INDEX_MAX_THREADS,
  QUICK_BACKFILL_LIMIT,
} from "@/lib/backfill/constants";

describe("formatFullIndexBannerDetail", () => {
  test("shows remaining count when total is known", () => {
    const detail = formatFullIndexBannerDetail({
      quickBackfillComplete: true,
      fullIndexComplete: false,
      indexedCount: 88,
      inboxTotalThreads: 400,
      remainingThreads: 312,
    });
    expect(detail).toBe("Indexing 312 more threads… (88/400)");
  });

  test("falls back when total is not yet known", () => {
    const detail = formatFullIndexBannerDetail({
      quickBackfillComplete: true,
      fullIndexComplete: false,
      indexedCount: 50,
      inboxTotalThreads: null,
      remainingThreads: 0,
    });
    expect(detail).toBe("Indexing older threads for search…");
  });
});

describe("indexing constants", () => {
  test("quick backfill keeps inbox lanes fast", () => {
    expect(QUICK_BACKFILL_LIMIT).toBe(50);
  });

  test("full index has a safety cap", () => {
    expect(FULL_INBOX_INDEX_MAX_THREADS).toBeGreaterThan(QUICK_BACKFILL_LIMIT);
  });
});
