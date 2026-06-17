import { describe, expect, test } from "bun:test";
import { GoogleProxyError } from "@/lib/corsair/google-proxy";
import {
  GmailApiDisabledError,
  isGmailApiDisabled,
  toGmailApiDisabledError,
} from "@/lib/corsair/api-errors";
import { isKekMismatchError, KEK_MISMATCH_HINT } from "@/lib/corsair/errors";

describe("GoogleProxyError", () => {
  test("exposes status and detail", () => {
    const error = new GoogleProxyError("failed", 502, "upstream timeout");
    expect(error.status).toBe(502);
    expect(error.detail).toBe("upstream timeout");
    expect(error.name).toBe("GoogleProxyError");
  });
});

describe("Gmail API disabled detection", () => {
  test("detects 403 gmail accessNotConfigured", () => {
    expect(
      isGmailApiDisabled({
        status: 403,
        body: { error: { message: "Gmail API has not been used in project 123" } },
      })
    ).toBe(true);
  });

  test("ignores unrelated 403 errors", () => {
    expect(
      isGmailApiDisabled({
        status: 403,
        body: { error: { message: "Insufficient Permission" } },
      })
    ).toBe(false);
  });

  test("maps to GmailApiDisabledError with activation metadata", () => {
    const mapped = toGmailApiDisabledError({
      status: 403,
      body: {
        error: {
          message: "accessNotConfigured",
          details: [
            {
              metadata: {
                consumer: "projects/demo",
                activationUrl: "https://console.cloud.google.com/apis",
              },
            },
          ],
        },
      },
    });
    expect(mapped).toBeInstanceOf(GmailApiDisabledError);
    expect(mapped.projectId).toBe("demo");
    expect(mapped.activationUrl).toContain("console.cloud.google.com");
  });
});

describe("Corsair KEK mismatch", () => {
  test("detects decrypt authentication failure message", () => {
    expect(
      isKekMismatchError(new Error("Unsupported state or unable to authenticate data"))
    ).toBe(true);
  });

  test("hint mentions corsair reset", () => {
    expect(KEK_MISMATCH_HINT).toContain("corsair:reset");
  });
});
