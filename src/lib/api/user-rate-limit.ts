import { NextResponse } from "next/server";

type RateLimitConfig = {
  windowMs: number;
  max: number;
};

const buckets = new Map<string, number[]>();

const ENDPOINT_LIMITS = {
  "agent-chat": { windowMs: 60_000, max: 20 },
  "inbox-send": { windowMs: 60_000, max: 30 },
  "inbox-draft": { windowMs: 60_000, max: 30 },
  "outbound-attachment": { windowMs: 60_000, max: 20 },
} as const satisfies Record<string, RateLimitConfig>;

export type UserRateLimitEndpoint = keyof typeof ENDPOINT_LIMITS;

export function checkUserRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const timestamps = (buckets.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= config.max) {
    const oldest = timestamps[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + config.windowMs - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  return { allowed: true };
}

export function rateLimitExceededResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    }
  );
}

/** Returns a 429 response when limited, otherwise null. */
export function enforceUserRateLimit(
  userId: string,
  endpoint: UserRateLimitEndpoint
): NextResponse | null {
  const config = ENDPOINT_LIMITS[endpoint];
  const result = checkUserRateLimit(`${endpoint}:${userId}`, config);
  if (!result.allowed) {
    return rateLimitExceededResponse(result.retryAfterSec);
  }
  return null;
}
