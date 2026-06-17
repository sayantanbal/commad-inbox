import { describe, expect, test } from "bun:test";
import {
  isAllowedLinearMcpTool,
  linearMcpToolName,
  LINEAR_MCP_ALLOWED_TOOLS,
} from "@/lib/agent/linear-mcp-allowlist";

describe("linearMcpToolName", () => {
  test("prefixes remote tool names", () => {
    expect(linearMcpToolName("create_issue")).toBe("linear_create_issue");
  });
});

describe("isAllowedLinearMcpTool", () => {
  test("allows curated Linear MCP tools only", () => {
    expect(isAllowedLinearMcpTool("create_issue")).toBe(true);
    expect(isAllowedLinearMcpTool("delete_team")).toBe(false);
  });

  test("allowlist includes create and list operations", () => {
    expect(LINEAR_MCP_ALLOWED_TOOLS.has("list_issues")).toBe(true);
    expect(LINEAR_MCP_ALLOWED_TOOLS.has("search_issues")).toBe(true);
  });
});
