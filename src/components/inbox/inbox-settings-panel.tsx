"use client";

import { FocusModeSettings } from "@/components/inbox/focus-mode-settings";
import { AiKeysSettings } from "@/components/inbox/ai-keys-settings";
import { ContactsSettings } from "@/components/inbox/contacts-settings";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { AiKeysStatus } from "@/lib/inbox/client-api";

interface InboxSettingsPanelProps {
  userEmail: string;
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
  googleContactsReturn?: string | null;
  googleContactsCount?: number | null;
}

export function InboxSettingsPanel(props: InboxSettingsPanelProps) {
  const {
    userEmail,
    aiKeysStatus,
    onAiKeysStatusChange,
    googleContactsReturn,
    googleContactsCount,
    ...focusProps
  } = props;

  return (
    <div className="space-y-6 p-4">
      <AiKeysSettings status={aiKeysStatus} onStatusChange={onAiKeysStatusChange} />
      <FocusModeSettings {...focusProps} />
      <ContactsSettings
        googleContactsReturn={googleContactsReturn}
        googleContactsCount={googleContactsCount}
      />
      <div className="border-t border-hairline pt-6">
        <p className="type-caption-strong text-ink">Account</p>
        <p className="mt-1 type-caption text-ink-muted-48">{userEmail}</p>
        <SignOutButton className="mt-3" />
      </div>
    </div>
  );
}
