import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

type RateLimitConfig = {
  windowSec: number;
  max: number;
};

const ENDPOINT_LIMITS = {
  "agent-chat": { windowSec: 60, max: 20 },
  "inbox-send": { windowSec: 60, max: 30 },
  "inbox-draft": { windowSec: 60, max: 30 },
  "outbound-attachment": { windowSec: 60, max: 20 },
} as const satisfies Record<string, RateLimitConfig>;

export type UserRateLimitEndpoint = keyof typeof ENDPOINT_LIMITS;

let redisClient: Redis | null | undefined;
const limiters = new Map<UserRateLimitEndpoint, Ratelimit>();

function upstashCredentials(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

function getRedisClient(): Redis | null {
  if (redisClient !== undefined) return redisClient;

  const credentials = upstashCredentials();
  if (!credentials) {
    redisClient = null;
    return null;
  }

  redisClient = new Redis(credentials);
  return redisClient;
}

function getLimiter(endpoint: UserRateLimitEndpoint): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) return null;

  const existing = limiters.get(endpoint);
  if (existing) return existing;

  const config = ENDPOINT_LIMITS[endpoint];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.max, `${config.windowSec} s`),
    prefix: `@command-inbox/rl/${endpoint}`,
    analytics: false,
  });
  limiters.set(endpoint, limiter);
  return limiter;
}

/** First client IP behind Vercel/proxy headers. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const client = forwarded.split(",")[0]?.trim();
    if (client) return client;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

/** Server-derived device bucket: IP + User-Agent + Accept-Language. */
export function buildDeviceFingerprint(request: Request): string {
  const ip = getClientIp(request);
  const ua = request.headers.get("user-agent") ?? "";
  const lang = request.headers.get("accept-language") ?? "";
  return createHash("sha256").update(`${ip}|${ua}|${lang}`).digest("hex").slice(0, 16);
}

export function buildRateLimitKey(
  endpoint: UserRateLimitEndpoint,
  userId: string,
  deviceFingerprint: string
): string {
  return `${endpoint}:${userId}:${deviceFingerprint}`;
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

/** Returns a 429 response when limited, otherwise null. Skips when Upstash is not configured. */
export async function enforceUserRateLimit(
  request: Request,
  userId: string,
  endpoint: UserRateLimitEndpoint
): Promise<NextResponse | null> {
  const limiter = getLimiter(endpoint);
  if (!limiter) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not configured — rate limiting skipped"
      );
    }
    return null;
  }

  const deviceFingerprint = buildDeviceFingerprint(request);
  const key = buildRateLimitKey(endpoint, userId, deviceFingerprint);
  const result = await limiter.limit(key);

  if (!result.success) {
    const retryAfterSec = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    return rateLimitExceededResponse(retryAfterSec);
  }

  return null;
}
