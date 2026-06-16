import { describe, expect, test } from "bun:test";
import { checkUserRateLimit } from "@/lib/api/user-rate-limit";

describe("checkUserRateLimit", () => {
  test("allows requests under the limit", () => {
    const key = `test-allow-${Date.now()}`;
    const config = { windowMs: 60_000, max: 3 };

    expect(checkUserRateLimit(key, config).allowed).toBe(true);
    expect(checkUserRateLimit(key, config).allowed).toBe(true);
    expect(checkUserRateLimit(key, config).allowed).toBe(true);
  });

  test("blocks when limit exceeded", () => {
    const key = `test-block-${Date.now()}`;
    const config = { windowMs: 60_000, max: 2 };

    expect(checkUserRateLimit(key, config).allowed).toBe(true);
    expect(checkUserRateLimit(key, config).allowed).toBe(true);
    const third = checkUserRateLimit(key, config);
    expect(third.allowed).toBe(false);
    if (!third.allowed) {
      expect(third.retryAfterSec).toBeGreaterThan(0);
    }
  });
});
