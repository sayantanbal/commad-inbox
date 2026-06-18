import { describe, expect, test } from "bun:test";
import {
  buildDeviceFingerprint,
  buildRateLimitKey,
  getClientIp,
} from "@/lib/api/user-rate-limit";

function requestWithHeaders(headers: Record<string, string>): Request {
  return new Request("https://example.com/api/test", { headers });
}

describe("getClientIp", () => {
  test("uses first x-forwarded-for hop", () => {
    const request = requestWithHeaders({
      "x-forwarded-for": "203.0.113.7, 10.0.0.1",
    });
    expect(getClientIp(request)).toBe("203.0.113.7");
  });

  test("falls back to x-real-ip", () => {
    const request = requestWithHeaders({ "x-real-ip": "198.51.100.42" });
    expect(getClientIp(request)).toBe("198.51.100.42");
  });

  test("returns unknown when no proxy headers", () => {
    expect(getClientIp(requestWithHeaders({}))).toBe("unknown");
  });
});

describe("buildDeviceFingerprint", () => {
  test("is stable for the same request signals", () => {
    const headers = {
      "x-forwarded-for": "203.0.113.7",
      "user-agent": "CommandInbox/1.0",
      "accept-language": "en-US,en;q=0.9",
    };
    const a = buildDeviceFingerprint(requestWithHeaders(headers));
    const b = buildDeviceFingerprint(requestWithHeaders(headers));
    expect(a).toBe(b);
    expect(a).toHaveLength(16);
  });

  test("changes when user-agent changes", () => {
    const base = {
      "x-forwarded-for": "203.0.113.7",
      "accept-language": "en-US",
    };
    const desktop = buildDeviceFingerprint(
      requestWithHeaders({ ...base, "user-agent": "Desktop" })
    );
    const mobile = buildDeviceFingerprint(
      requestWithHeaders({ ...base, "user-agent": "Mobile" })
    );
    expect(desktop).not.toBe(mobile);
  });
});

describe("buildRateLimitKey", () => {
  test("includes endpoint, user, and device bucket", () => {
    expect(buildRateLimitKey("agent-chat", "user-1", "abc123")).toBe(
      "agent-chat:user-1:abc123"
    );
  });
});
