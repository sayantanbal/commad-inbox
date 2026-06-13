"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getToolName, type DynamicToolUIPart, type ToolUIPart } from "ai";

type ApprovableToolPart = ToolUIPart | DynamicToolUIPart;

interface AgentToolApprovalProps {
  part: ApprovableToolPart;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
}

export function AgentToolApproval({ part, onApprove, onDeny }: AgentToolApprovalProps) {
  const input = part.input as Record<string, unknown> | undefined;
  const code = typeof input?.code === "string" ? input.code : null;
  const toolName = getToolName(part);

  return (
    <div className="mr-2 space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
      <p className="font-medium text-amber-200">Approve Corsair action</p>
      <p className="text-xs text-muted-foreground">
        Tool: <span className="font-mono text-foreground">{toolName}</span>
      </p>
      {code ? (
        <pre className="max-h-40 overflow-auto rounded-md border border-border bg-background/80 p-2 text-[11px] leading-relaxed text-foreground/90">
          {code}
        </pre>
      ) : (
        <pre className="max-h-32 overflow-auto rounded-md border border-border bg-background/80 p-2 text-[11px]">
          {JSON.stringify(input ?? {}, null, 2)}
        </pre>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => part.approval?.id && onApprove(part.approval.id)}
        >
          <Check className="h-3 w-3" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          onClick={() => part.approval?.id && onDeny(part.approval.id)}
        >
          <X className="h-3 w-3" />
          Deny
        </Button>
      </div>
    </div>
  );
}
