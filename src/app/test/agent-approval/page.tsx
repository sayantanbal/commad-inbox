import { notFound } from "next/navigation";
import { AgentApprovalHarness } from "./agent-approval-harness";

export const dynamic = "force-dynamic";

export default function AgentApprovalTestPage() {
  if (process.env.E2E_TEST !== "1" && process.env.NODE_ENV === "production") {
    notFound();
  }

  return <AgentApprovalHarness />;
}
