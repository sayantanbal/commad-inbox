/** Linear remote MCP tools exposed to the inbox agent (OD-2: Linear only). */
export const LINEAR_MCP_ALLOWED_TOOLS = new Set([
  "list_issues",
  "get_issue",
  "search_issues",
  "list_teams",
  "list_projects",
  "create_issue",
]);

export const LINEAR_MCP_WRITE_TOOLS = new Set(["create_issue", "update_issue"]);

export function isAllowedLinearMcpTool(name: string): boolean {
  return LINEAR_MCP_ALLOWED_TOOLS.has(name);
}

export function linearMcpToolName(name: string): string {
  return `linear_${name}`;
}
