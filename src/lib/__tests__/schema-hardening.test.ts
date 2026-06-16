import { describe, expect, test } from "bun:test";
import {
  agentChatBodySchema,
  contactsImportJsonBodySchema,
} from "@/lib/schemas/api";
import { boundedJsonValue, uiMessagePartSchema } from "@/lib/schemas/primitives";

describe("schema hardening", () => {
  test("rejects unknown keys on strict API bodies", () => {
    const result = agentChatBodySchema.safeParse({
      messages: [],
      provider: "openai",
      extraField: "nope",
    });
    expect(result.success).toBe(false);
  });

  test("rejects oversized agent chat payloads", () => {
    const result = agentChatBodySchema.safeParse({
      messages: [
        {
          id: "m1",
          role: "user",
          parts: [{ type: "text", text: "x".repeat(200_000) }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test("rejects passthrough tool parts with unbounded nested data", () => {
    const deep: Record<string, unknown> = {};
    let cursor = deep;
    for (let i = 0; i < 20; i++) {
      const next: Record<string, unknown> = {};
      cursor.nested = next;
      cursor = next;
    }

    const result = uiMessagePartSchema.safeParse({
      type: "dynamic-tool",
      toolName: "send_email",
      toolCallId: "call-1",
      state: "input-available",
      input: deep,
    });
    expect(result.success).toBe(false);
  });

  test("boundedJsonValue rejects oversized strings", () => {
    const result = boundedJsonValue.safeParse("x".repeat(20_000));
    expect(result.success).toBe(false);
  });

  test("contacts import allows source-only payloads", () => {
    const result = contactsImportJsonBodySchema.safeParse({ source: "demo-contacts" });
    expect(result.success).toBe(true);
  });

  test("contacts import rejects emails without source when empty", () => {
    const result = contactsImportJsonBodySchema.safeParse({ emails: [] });
    expect(result.success).toBe(false);
  });
});
