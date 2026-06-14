"use client";

import { Button } from "@/components/ui/button";
import type { MeetingBriefStored } from "@/lib/schemas/domain";

interface MeetingPreBriefPanelProps {
  open: boolean;
  loading: boolean;
  brief: MeetingBriefStored | null;
  onClose: () => void;
}

export function MeetingPreBriefPanel({ open, loading, brief, onClose }: MeetingPreBriefPanelProps) {
  if (!open) return null;

  return (
    <div className="border-b border-border bg-secondary/40 px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Pre-brief</p>
          {brief && (
            <p className="text-sm font-medium">
              {brief.attendeeName} · {brief.attendeeEmail}
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      {loading ? (
        <p className="mt-2 text-sm text-muted-foreground">Building brief…</p>
      ) : brief ? (
        <div className="mt-3 space-y-3 text-sm">
          <p className="text-muted-foreground">{brief.toneSummary}</p>
          {brief.openCommitments.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground">Open commitments</p>
              <ul className="mt-1 list-inside list-disc text-muted-foreground">
                {brief.openCommitments.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-foreground">Recent threads</p>
            <ul className="mt-1 space-y-1">
              {brief.recentThreads.map((t) => (
                <li key={t.subject} className="text-xs text-muted-foreground">
                  <span className="text-foreground">{t.subject}</span> — {t.snippet}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">Attachments: {brief.attachmentsNote}</p>
        </div>
      ) : null}
    </div>
  );
}
