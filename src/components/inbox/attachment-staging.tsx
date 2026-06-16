"use client";

import { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  attachmentSizeWarning,
  formatBytes,
  validateTotalAttachmentSize,
} from "@/lib/gmail/attachment-limits";
import type { OutboundAttachmentMeta } from "@/lib/inbox/client-api";
import {
  deleteOutboundAttachmentApi,
  uploadOutboundAttachmentApi,
} from "@/lib/inbox/client-api";
import { cn } from "@/lib/utils";

interface AttachmentStagingProps {
  attachments: OutboundAttachmentMeta[];
  onChange: (attachments: OutboundAttachmentMeta[]) => void;
  disabled?: boolean;
  className?: string;
}

export function AttachmentStaging({
  attachments,
  onChange,
  disabled,
  className,
}: AttachmentStagingProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalBytes = attachments.reduce((sum, item) => sum + item.sizeBytes, 0);
  const warning = attachmentSizeWarning(totalBytes);
  const blocked = validateTotalAttachmentSize(totalBytes) !== null;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const next = [...attachments];
      for (const file of Array.from(files)) {
        const uploaded = await uploadOutboundAttachmentApi(file);
        const candidate = [...next, uploaded];
        const totalBytes = candidate.reduce((sum, item) => sum + item.sizeBytes, 0);
        const totalError = validateTotalAttachmentSize(totalBytes);
        if (totalError) {
          await deleteOutboundAttachmentApi(uploaded.id).catch(() => undefined);
          setError(totalError);
          return;
        }
        next.push(uploaded);
      }
      onChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeAttachment(id: string) {
    setError(null);
    onChange(attachments.filter((item) => item.id !== id));
    try {
      await deleteOutboundAttachmentApi(id);
    } catch {
      /* best-effort cleanup */
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*,audio/*,video/*,application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.vcf"
          onChange={(event) => void handleFiles(event.target.files)}
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={disabled || uploading}
          onClick={() => fileRef.current?.click()}
          className="h-8 px-2"
        >
          <Paperclip className="h-4 w-4" strokeWidth={1.75} />
          {uploading ? "Uploading…" : "Attach"}
        </Button>
        {attachments.map((item) => (
          <span
            key={item.id}
            className="inline-flex items-center gap-1 rounded-full border border-hairline bg-pearl px-2 py-1 type-fine text-ink"
          >
            <span className="max-w-[140px] truncate">{item.filename}</span>
            <span className="text-ink-muted-48">({formatBytes(item.sizeBytes)})</span>
            <button
              type="button"
              className="text-ink-muted-48 hover:text-ink"
              onClick={() => void removeAttachment(item.id)}
              aria-label={`Remove ${item.filename}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      {warning && !blocked ? (
        <p className="type-fine text-[color:var(--color-warning)]">{warning}</p>
      ) : null}
      {error ? (
        <p className="type-fine text-[color:var(--color-destructive)]">{error}</p>
      ) : null}
    </div>
  );
}
