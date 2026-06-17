import { buildCorsairToolDefs } from "@corsair-dev/mcp";
import { tool, type ToolSet } from "ai";
import { z } from "zod";
import type { CorsairInstance } from "@/lib/corsair";
import { buildAgentActionTools } from "@/lib/agent/action-tools";
import { isAllowedCorsairMcpTool } from "@/lib/agent/corsair-tool-allowlist";
import { buildLinearMcpTools } from "@/lib/agent/linear-mcp";
import { toolMetadata } from "@/lib/agent/tool-annotations";

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
  userId: string,
  userEmail: string
): ToolSet {
  const defs = buildCorsairToolDefs({
    corsair: tenant,
    tenantId: userId,
    setup: false,
  });

  const tools: ToolSet = { ...buildAgentActionTools(tenant, userId, userEmail) };

  for (const def of defs) {
    if (!isAllowedCorsairMcpTool(def.name)) continue;

    tools[def.name] = tool({
      description: def.description,
      inputSchema: z.object(def.shape).strict(),
      metadata: toolMetadata(def.name),
      execute: async (input) => {
        const result = await def.handler(input as Record<string, unknown>);
        return toolResultToOutput(result);
      },
    });
  }

  return tools;
}

/** In-process Corsair + typed workflow tools + optional Linear remote MCP. */
export async function buildAllAgentTools(
  tenant: ReturnType<CorsairInstance["withTenant"]>,
  userId: string,
  userEmail: string
): Promise<ToolSet> {
  const core = buildAgentMcpTools(tenant, userId, userEmail);
  const linear = await buildLinearMcpTools(userId);
  return { ...core, ...linear };
}
