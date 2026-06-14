import { describe, expect, test } from "bun:test";
import { commitmentExtractionResultSchema } from "@/lib/schemas/domain";
import { resolveSnippetVariables } from "@/lib/snippets/variables";

describe("commitmentExtractionResultSchema", () => {
  test("accepts valid extraction output", () => {
    const parsed = commitmentExtractionResultSchema.safeParse({
      commitments: [
        {
          text: "Send deck by Friday",
          direction: "outbound",
          counterpartyEmail: "client@example.com",
          dueDate: null,
          confidence: 0.85,
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  test("rejects invalid confidence", () => {
    const parsed = commitmentExtractionResultSchema.safeParse({
      commitments: [
        {
          text: "Maybe",
          direction: "inbound",
          counterpartyEmail: "not-an-email",
          dueDate: null,
          confidence: 1.5,
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });
});

describe("resolveSnippetVariables", () => {
  test("replaces first_name and project_name", () => {
    const result = resolveSnippetVariables(
      "Hi {{first_name}}, re {{project_name}}",
      { firstName: "Priya", projectName: "Q2 launch" }
    );
    expect(result).toBe("Hi Priya, re Q2 launch");
  });
});

describe("sendTimeSuggestionSchema", () => {
  test("accepts valid suggestion shape", async () => {
    const { sendTimeSuggestionSchema } = await import("@/lib/schemas/domain");
    const parsed = sendTimeSuggestionSchema.safeParse({
      suggestedAt: new Date().toISOString(),
      reason: "They usually reply Tuesday morning.",
      confidence: "high",
    });
    expect(parsed.success).toBe(true);
  });
});
