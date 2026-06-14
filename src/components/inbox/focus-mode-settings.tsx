"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FocusModeSettingsProps {
  batchWindows: string[];
  focusModeEnabled: boolean;
  autoResponderTemplate: string;
  onToggleFocus: (enabled: boolean) => void;
  onUpdateTemplate: (template: string) => void;
  onConnectLinear?: () => void;
  linearToken: string;
  linearTeamId: string;
  onLinearTokenChange: (v: string) => void;
  onLinearTeamIdChange: (v: string) => void;
  onSaveLinear: () => void;
}

export function FocusModeSettings({
  batchWindows,
  focusModeEnabled,
  autoResponderTemplate,
  onToggleFocus,
  onUpdateTemplate,
  linearToken,
  linearTeamId,
  onLinearTokenChange,
  onLinearTeamIdChange,
  onSaveLinear,
}: FocusModeSettingsProps) {
  return (
    <div className="space-y-6 p-4">
      <section>
        <h3 className="text-sm font-semibold">Focus mode</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Batch windows: {batchWindows.join(", ")}. During focus, notifications are suppressed and
          senders get one auto-reply per day.
        </p>
        <Button
          variant={focusModeEnabled ? "default" : "outline"}
          size="sm"
          className="mt-2"
          onClick={() => onToggleFocus(!focusModeEnabled)}
        >
          {focusModeEnabled ? "Focus mode on" : "Focus mode off"}
        </Button>
      </section>
      <section>
        <h3 className="text-sm font-semibold">Auto-reply template</h3>
        <textarea
          className="mt-2 min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={autoResponderTemplate}
          onChange={(e) => onUpdateTemplate(e.target.value)}
        />
      </section>
      <section>
        <h3 className="text-sm font-semibold">Linear connection</h3>
        <p className="mt-1 text-xs text-muted-foreground">Paste API key and team ID for T → export</p>
        <Input
          className="mt-2"
          placeholder="lin_api_…"
          value={linearToken}
          onChange={(e) => onLinearTokenChange(e.target.value)}
        />
        <Input
          className="mt-2"
          placeholder="Team UUID"
          value={linearTeamId}
          onChange={(e) => onLinearTeamIdChange(e.target.value)}
        />
        <Button size="sm" className="mt-2" onClick={onSaveLinear}>
          Save Linear
        </Button>
      </section>
    </div>
  );
}
