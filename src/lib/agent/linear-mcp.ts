import "server-only";

import { createMCPClient } from "@ai-sdk/mcp";
import { tool, type ToolSet } from "ai";
import { getLinearConnection } from "@/lib/integrations/linear";
import {
  isAllowedLinearMcpTool,
  LINEAR_MCP_WRITE_TOOLS,
  linearMcpToolName,
} from "@/lib/agent/linear-mcp-allowlist";

const DEFAULT_LINEAR_MCP_URL = "https://mcp.linear.app/mcp";

function linearAuthHeader(accessToken: string): string {
  const trimmed = accessToken.trim();
  if (/^bearer\s+/i.test(trimmed)) return trimmed;
  return trimmed;
}

/**
 * Connects to Linear's hosted MCP server using the user's saved API token.
 * Returns an empty set when Linear is not connected or MCP is unreachable.
 */
export async function buildLinearMcpTools(userId: string): Promise<ToolSet> {
  const conn = await getLinearConnection(userId);
  if (!conn?.accessToken) return {};

  const url = process.env.LINEAR_MCP_URL?.trim() || DEFAULT_LINEAR_MCP_URL;

  let client: Awaited<ReturnType<typeof createMCPClient>> | null = null;
  try {
    client = await createMCPClient({
      clientName: "command-inbox",
      transport: {
        type: "http",
        url,
        headers: {
          Authorization: linearAuthHeader(conn.accessToken),
        },
        redirect: "error",
      },
      onUncaughtError: (error) => {
        console.warn("[linear-mcp] uncaught client error", error);
      },
    });

    const remoteTools = await client.tools();
    const tools: ToolSet = {};

    for (const [name, remoteTool] of Object.entries(remoteTools)) {
      if (!isAllowedLinearMcpTool(name)) continue;

      const prefixed = linearMcpToolName(name);
      const needsApproval = LINEAR_MCP_WRITE_TOOLS.has(name);

      tools[prefixed] = tool({
        description: `[Linear MCP] ${remoteTool.description ?? name}`,
        inputSchema: remoteTool.inputSchema,
        ...(needsApproval ? { needsApproval: true as const } : {}),
        execute: remoteTool.execute,
      });
    }

    return tools;
  } catch (error) {
    console.warn("[linear-mcp] unavailable for user", userId, error);
    return {};
  }
}
