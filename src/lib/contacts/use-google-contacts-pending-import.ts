"use client";

import { useEffect, useRef, useState } from "react";
import { syncGoogleContactsApi } from "@/lib/inbox/client-api";

export function formatGoogleContactsImportMessage(result: {
  imported: number;
  total: number;
}): string {
  return `Imported ${result.imported} contact${result.imported === 1 ? "" : "s"} (${result.total} total in Google).`;
}

export function useGoogleContactsPendingImport(
  pending: boolean,
  onComplete?: (result: { imported: number; skipped: number; total: number }) => void
) {
  const started = useRef(false);
  const [importing, setImporting] = useState(pending);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    pending ? "Importing contacts from Google…" : null
  );

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!pending || started.current) return;
    started.current = true;

    void (async () => {
      setImporting(true);
      setError(null);
      setNotice("Importing contacts from Google…");
      try {
        const result = await syncGoogleContactsApi();
        setNotice(formatGoogleContactsImportMessage(result));
        onCompleteRef.current?.(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google Contacts import failed");
        setNotice(null);
      } finally {
        setImporting(false);
      }
    })();
  }, [pending]);

  return { importing, error, notice, setError, setNotice };
}
