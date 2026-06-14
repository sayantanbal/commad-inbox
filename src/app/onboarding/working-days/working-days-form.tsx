"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimezoneSelect } from "@/components/preferences/timezone-select";
import {
  DEFAULT_WORKING_DAYS,
  workingDaysToAiSummary,
  type WorkingDaysStructured,
} from "@/lib/preferences/sanitize-working-days";
import { resolveTimezoneSelection } from "@/lib/preferences/timezones";

const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

interface WorkingDaysFormProps {
  initialTimezone: string;
  initialStructured: WorkingDaysStructured | null;
  initialTextOverride: string | null;
}

export function WorkingDaysForm({
  initialTimezone,
  initialStructured,
  initialTextOverride,
}: WorkingDaysFormProps) {
  const router = useRouter();
  const [timezone, setTimezone] = useState(() => resolveTimezoneSelection(initialTimezone));
  const [structured, setStructured] = useState<WorkingDaysStructured>(
    initialStructured ?? {
      ...DEFAULT_WORKING_DAYS,
      timezone: initialTimezone,
    }
  );
  const [textOverride, setTextOverride] = useState(initialTextOverride ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(
    () =>
      workingDaysToAiSummary(
        { ...structured, timezone },
        textOverride.trim() ? textOverride : null
      ),
    [structured, timezone, textOverride]
  );

  function toggleDay(day: string) {
    setStructured((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: {
          ...prev.days[day],
          enabled: !prev.days[day]?.enabled,
        },
      },
    }));
  }

  function updateDayTime(day: string, field: "start" | "end", value: string) {
    setStructured((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: {
          ...prev.days[day],
          [field]: value,
        },
      },
    }));
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/inbox/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timezone,
          workingDaysStructured: { ...structured, timezone },
          workingDaysTextOverride: textOverride.trim() || null,
          workingDaysSource: "wizard",
        }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save");
      }
      router.push("/onboarding/contacts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <label className="type-caption text-ink-muted-48" htmlFor="working-days-timezone">
        Timezone
      </label>
      <TimezoneSelect
        id="working-days-timezone"
        className="mt-2"
        value={timezone}
        onChange={setTimezone}
      />

      <div className="mt-6 space-y-3">
        {Object.keys(DAY_LABELS).map((day) => {
          const slot = structured.days[day] ?? { enabled: false, start: "09:00", end: "17:00" };
          return (
            <div
              key={day}
              className="flex flex-wrap items-center gap-3 rounded-[8px] border border-hairline px-4 py-3"
            >
              <label className="flex min-w-[120px] items-center gap-2 type-body text-ink">
                <input
                  type="checkbox"
                  checked={slot.enabled}
                  onChange={() => toggleDay(day)}
                  className="h-4 w-4 rounded border-border"
                />
                {DAY_LABELS[day]}
              </label>
              {slot.enabled ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    className="w-[120px] rounded-[8px]"
                    value={slot.start}
                    onChange={(e) => updateDayTime(day, "start", e.target.value)}
                  />
                  <span className="type-caption text-ink-muted-48">to</span>
                  <Input
                    type="time"
                    className="w-[120px] rounded-[8px]"
                    value={slot.end}
                    onChange={(e) => updateDayTime(day, "end", e.target.value)}
                  />
                </div>
              ) : (
                <span className="type-caption text-ink-muted-48">Off</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <label className="type-caption text-ink-muted-48">
          Extra notes (optional)
        </label>
        <textarea
          className="mt-2 min-h-[80px] w-full rounded-[8px] border border-border bg-input px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={textOverride}
          onChange={(e) => setTextOverride(e.target.value)}
          placeholder="No meetings before 10am. Lunch 12:30–13:30."
          maxLength={2048}
        />
      </div>

      <div className="mt-6 rounded-[8px] bg-[rgba(0,102,204,0.06)] px-4 py-3">
        <p className="type-caption text-ink-muted-48">Scheduling preview</p>
        <p className="mt-1 type-body text-ink">{preview}</p>
      </div>

      {error ? (
        <p className="mt-4 type-caption text-[color:var(--color-destructive)]">{error}</p>
      ) : null}

      <Button size="lg" className="mt-8 w-full" onClick={() => void handleSubmit()} disabled={saving}>
        Continue
        <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
      </Button>
    </div>
  );
}
