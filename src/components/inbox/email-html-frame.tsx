"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildEmailPreviewDocument, splitQuotedHtml } from "@/lib/gmail/email-html";

const FORWARDED_KEYS = new Set(["e", "r", "m", "s", "j", "k"]);

interface EmailHtmlFrameProps {
  html: string;
}

function HtmlFrame({ srcDoc }: { srcDoc: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(240);

  const resize = useCallback(() => {
    const doc = ref.current?.contentDocument;
    if (!doc) return;
    const next = Math.max(doc.documentElement.scrollHeight, doc.body?.scrollHeight ?? 0);
    setHeight(Math.min(Math.max(next + 8, 80), 2400));
  }, []);

  useEffect(() => {
    const iframe = ref.current;
    const doc = iframe?.contentDocument;
    if (!doc) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (!FORWARDED_KEYS.has(key)) return;
      event.preventDefault();
      window.dispatchEvent(new CustomEvent("inbox-hotkey", { detail: { key } }));
    };

    doc.addEventListener("keydown", onKeyDown);
    return () => doc.removeEventListener("keydown", onKeyDown);
  }, [srcDoc]);

  useEffect(() => {
    resize();
  }, [srcDoc, resize]);

  return (
    <iframe
      ref={ref}
      title="Email message"
      tabIndex={-1}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      srcDoc={srcDoc}
      onLoad={resize}
      className="w-full rounded-md border border-[#dadce0] bg-white"
      style={{ height, minHeight: 80 }}
    />
  );
}

export function EmailHtmlFrame({ html }: EmailHtmlFrameProps) {
  const [showQuoted, setShowQuoted] = useState(false);
  const { main, quoted } = useMemo(() => splitQuotedHtml(html), [html]);

  const mainDoc = useMemo(() => buildEmailPreviewDocument(main), [main]);
  const quotedDoc = useMemo(
    () => (quoted ? buildEmailPreviewDocument(quoted) : null),
    [quoted]
  );

  return (
    <div className="space-y-2">
      <HtmlFrame srcDoc={mainDoc} />
      {quoted && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowQuoted((value) => !value)}
          >
            {showQuoted ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Hide quoted text
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Show quoted text
              </>
            )}
          </Button>
          {showQuoted && quotedDoc && <HtmlFrame srcDoc={quotedDoc} />}
        </>
      )}
    </div>
  );
}
