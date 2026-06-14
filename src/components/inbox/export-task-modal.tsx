"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ExportTaskModalProps {
  open: boolean;
  title: string;
  description: string;
  loading: boolean;
  onClose: () => void;
  onExport: (title: string, description: string) => void;
}

export function ExportTaskModal({
  open,
  title: initialTitle,
  description: initialDescription,
  loading,
  onClose,
  onExport,
}: ExportTaskModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-4 shadow-lg">
        <h2 className="text-sm font-semibold">Create Linear issue</h2>
        <p className="mt-1 text-xs text-muted-foreground">Notion and GitHub — coming soon</p>
        <div className="mt-4 space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <textarea
            className="min-h-[120px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={loading} onClick={() => onExport(title, description)}>
            {loading ? "Creating…" : "Create in Linear"}
          </Button>
        </div>
      </div>
    </div>
  );
}
