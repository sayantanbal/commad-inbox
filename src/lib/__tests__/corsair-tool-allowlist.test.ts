import { describe, expect, test } from "bun:test";
import {
  ALLOWED_CORSAIR_MCP_TOOLS,
  isAllowedCorsairMcpTool,
} from "@/lib/agent/corsair-tool-allowlist";

describe("corsair MCP allowlist", () => {
  test("allows discovery tools only", () => {
    expect(isAllowedCorsairMcpTool("list_operations")).toBe(true);
    expect(isAllowedCorsairMcpTool("get_schema")).toBe(true);
  });

  test("blocks run_script and setup", () => {
    expect(isAllowedCorsairMcpTool("run_script")).toBe(false);
    expect(isAllowedCorsairMcpTool("corsair_setup")).toBe(false);
  });

  test("allowlist size matches policy", () => {
    expect(ALLOWED_CORSAIR_MCP_TOOLS.size).toBe(2);
  });
});
