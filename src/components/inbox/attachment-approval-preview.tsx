"use client";

import { useEffect, useState } from "react";
import { Paperclip } from "lucide-react";
import {
  attachmentSizeWarning,
  formatBytes,
  OVERSIZE_ATTACHMENT_MESSAGE,
  validateTotalAttachmentSize,
} from "@/lib/gmail/attachment-limits";
import {
  fetchOutboundAttachmentMetaApi,
  type OutboundAttachmentMeta,
} from "@/lib/inbox/client-api";

export function AttachmentApprovalPreview({ attachmentIds }: { attachmentIds: string[] }) {
  const [items, setItems] = useState<OutboundAttachmentMeta[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (attachmentIds.length === 0) {
      setItems([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchOutboundAttachmentMetaApi(attachmentIds)
      .then((meta) => {
        if (!cancelled) setItems(meta);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attachmentIds]);

  if (attachmentIds.length === 0) return null;

  const totalBytes = items.reduce((sum, item) => sum + item.sizeBytes, 0);
  const oversizeError = validateTotalAttachmentSize(totalBytes);
  const warning = attachmentSizeWarning(totalBytes);

  return (
    <div className="border-t border-hairline pt-2 space-y-2">
      <p className="type-fine text-ink-muted-48 flex items-center gap-1">
        <Paperclip className="h-3 w-3" strokeWidth={1.75} />
        Attachments
      </p>
      {loading && items.length === 0 ? (
        <p className="type-caption text-ink-muted-48">Loading attachments…</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id} className="type-caption text-ink">
              {item.filename}{" "}
              <span className="text-ink-muted-48">({formatBytes(item.sizeBytes)})</span>
            </li>
          ))}
          {items.length === 0 ? (
            <li className="type-caption text-ink-muted-48">
              {attachmentIds.length} attachment(s) — metadata unavailable
            </li>
          ) : null}
        </ul>
      )}
      {oversizeError ? (
        <p className="type-fine text-[color:var(--color-destructive)]">{OVERSIZE_ATTACHMENT_MESSAGE}</p>
      ) : warning ? (
        <p className="type-fine text-[color:var(--color-warning)]">{warning}</p>
      ) : null}
    </div>
  );
}

export function useAttachmentApprovalState(attachmentIds: string[]) {
  const [items, setItems] = useState<OutboundAttachmentMeta[]>([]);

  useEffect(() => {
    if (attachmentIds.length === 0) {
      setItems([]);
      return;
    }
    let cancelled = false;
    void fetchOutboundAttachmentMetaApi(attachmentIds)
      .then((meta) => {
        if (!cancelled) setItems(meta);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [attachmentIds]);

  const totalBytes = items.reduce((sum, item) => sum + item.sizeBytes, 0);
  const blocked = validateTotalAttachmentSize(totalBytes) !== null;

  return { blocked, items, totalBytes };
}
