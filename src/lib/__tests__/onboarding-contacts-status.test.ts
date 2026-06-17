import { describe, expect, test } from "bun:test";
import { parseOnboardingContactsStatus } from "@/lib/contacts/onboarding-contacts-status";

describe("parseOnboardingContactsStatus", () => {
  test("accepts google and demo statuses", () => {
    expect(parseOnboardingContactsStatus("google")).toBe("google");
    expect(parseOnboardingContactsStatus("demo")).toBe("demo");
  });

  test("falls back to skipped for unknown values", () => {
    expect(parseOnboardingContactsStatus("unknown")).toBe("skipped");
    expect(parseOnboardingContactsStatus(undefined)).toBe("skipped");
  });
});
