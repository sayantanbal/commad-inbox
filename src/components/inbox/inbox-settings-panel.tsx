"use client";

import { FocusModeSettings } from "@/components/inbox/focus-mode-settings";
import { AiKeysSettings } from "@/components/inbox/ai-keys-settings";
import type { AiKeysStatus } from "@/lib/inbox/client-api";

interface InboxSettingsPanelProps {
  batchWindows: string[];
  focusModeEnabled: boolean;
  autoResponderTemplate: string;
  onToggleFocus: (enabled: boolean) => void;
  onUpdateTemplate: (template: string) => void;
  linearToken: string;
  linearTeamId: string;
  onLinearTokenChange: (v: string) => void;
  onLinearTeamIdChange: (v: string) => void;
  onSaveLinear: () => void;
  aiKeysStatus: AiKeysStatus | null;
  onAiKeysStatusChange: (status: AiKeysStatus) => void;
}

export function InboxSettingsPanel(props: InboxSettingsPanelProps) {
  const { aiKeysStatus, onAiKeysStatusChange, ...focusProps } = props;

  return (
    <div className="space-y-6 p-4">
      <AiKeysSettings status={aiKeysStatus} onStatusChange={onAiKeysStatusChange} />
      <FocusModeSettings {...focusProps} />
    </div>
  );
}
