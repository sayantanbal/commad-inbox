import { buildCorsairToolDefs } from "@corsair-dev/mcp";
import { tool, type ToolSet } from "ai";
import { z } from "zod";
import type { CorsairInstance } from "@/lib/corsair";

const APPROVAL_TOOLS = new Set(["run_script"]);

function toolResultToOutput(result: {
  content: Array<{ type: string; text?: string }>;
  isError?: boolean;
}): string {
  const text = result.content
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("\n")
    .trim();

  if (result.isError) {
    throw new Error(text || "Corsair tool failed");
  }

  return text || "(no output)";
}

export function buildAgentMcpTools(
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  userId: string
): ToolSet {
  const defs = buildCorsairToolDefs({
    corsair: tenant,
    tenantId: userId,
    setup: false,
  });

  const tools: ToolSet = {};

  for (const def of defs) {
    tools[def.name] = tool({
      description: def.description,
      inputSchema: z.object(def.shape),
      needsApproval: APPROVAL_TOOLS.has(def.name),
      execute: async (input) => {
        const result = await def.handler(input as Record<string, unknown>);
        return toolResultToOutput(result);
      },
    });
  }

  return tools;
}
