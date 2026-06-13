"use client";

import { ChevronDown } from "lucide-react";
import {
  AI_PROVIDER_CONFIG,
  AI_PROVIDER_IDS,
  type AiProvider,
} from "@/lib/ai/providers";
import { cn } from "@/lib/utils";

interface AiProviderSelectProps {
  value: AiProvider;
  onChange: (provider: AiProvider) => void;
  className?: string;
  disabled?: boolean;
}

export function AiProviderSelect({
  value,
  onChange,
  className,
  disabled,
}: AiProviderSelectProps) {
  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as AiProvider)}
        className="h-7 appearance-none rounded-md border border-border bg-background/80 py-0 pr-6 pl-2 text-[11px] text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        aria-label="AI provider"
      >
        {AI_PROVIDER_IDS.map((id) => (
          <option key={id} value={id}>
            {AI_PROVIDER_CONFIG[id].chatLabel}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3 text-muted-foreground" />
    </div>
  );
}
