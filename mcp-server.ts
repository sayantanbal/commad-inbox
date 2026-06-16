import { runStdioMcpServer } from "@corsair-dev/mcp";
import { corsair } from "./corsair";

runStdioMcpServer({ corsair }).catch((err) => {
  console.error("[corsair-mcp] Fatal:", err);
  process.exit(1);
});
