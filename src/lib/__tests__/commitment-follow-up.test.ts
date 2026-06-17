import { describe, expect, test } from "bun:test";
import { commitmentFollowUpBodySchema } from "@/lib/schemas/api";

describe("commitmentFollowUpBodySchema", () => {
  test("accepts commitmentId", () => {
    const parsed = commitmentFollowUpBodySchema.safeParse({
      commitmentId: "user:thread:msg:0",
    });
    expect(parsed.success).toBe(true);
  });

  test("rejects empty commitmentId", () => {
    const parsed = commitmentFollowUpBodySchema.safeParse({
      commitmentId: "",
    });
    expect(parsed.success).toBe(false);
  });
});
