"use client";

import { useMemo } from "react";
import { getTimezoneOptions } from "@/lib/preferences/timezones";
import { cn } from "@/lib/utils";

interface TimezoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export function TimezoneSelect({
  value,
  onChange,
  id,
  className,
  disabled,
}: TimezoneSelectProps) {
  const grouped = useMemo(() => {
    const options = getTimezoneOptions();
    const byGroup = new Map<string, typeof options>();

    for (const option of options) {
      const list = byGroup.get(option.group) ?? [];
      list.push(option);
      byGroup.set(option.group, list);
    }

    return [...byGroup.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, []);

  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "flex h-10 w-full rounded-[8px] border border-border bg-input px-3 py-2 text-sm text-ink",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {grouped.map(([group, options]) => (
        <optgroup key={group} label={group.replace(/_/g, " ")}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
