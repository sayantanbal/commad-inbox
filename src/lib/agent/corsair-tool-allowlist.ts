/**
 * Corsair MCP discovery tools allowed in the in-app agent.
 * Write operations use typed workflow tools in action-tools.ts — not run_script.
 */
export const ALLOWED_CORSAIR_MCP_TOOLS = new Set(["list_operations", "get_schema"]);

export function isAllowedCorsairMcpTool(name: string): boolean {
  return ALLOWED_CORSAIR_MCP_TOOLS.has(name);
}
