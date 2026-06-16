"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AttachmentStaging } from "@/components/inbox/attachment-staging";
import { KbdBadge } from "@/components/ui/kbd-badge";
import type { OutboundAttachmentMeta } from "@/lib/inbox/client-api";
import type { SendTimeSuggestion } from "@/lib/schemas/domain";

interface SnippetOption {
  id: string;
  name: string;
  body: string;
}

interface ComposerPanelProps {
  open: boolean;
  subject: string;
  modLabel: string;
  initialContent?: string;
  loading?: boolean;
  snippets?: SnippetOption[];
  sendTimeSuggestion?: SendTimeSuggestion | null;
  onClose: () => void;
  onSend: (body: string, attachmentIds?: string[]) => void;
  onToneChange?: (tone: "professional" | "friendly" | "brief") => void;
  onSendLater?: (body: string, attachmentIds?: string[]) => void;
  onOpenSendLater?: (body: string, attachmentIds?: string[]) => void;
}

export function ComposerPanel({
  open,
  subject,
  modLabel,
  initialContent = "",
  loading = false,
  snippets = [],
  sendTimeSuggestion,
  onClose,
  onSend,
  onToneChange,
  onSendLater,
  onOpenSendLater,
}: ComposerPanelProps) {
  const onCloseRef = useRef(onClose);
  const onSendRef = useRef(onSend);
  const attachmentIdsRef = useRef<string[]>([]);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);
  const [snippetQuery, setSnippetQuery] = useState("");
  const [snippetOpen, setSnippetOpen] = useState(false);
  const [stagedAttachments, setStagedAttachments] = useState<OutboundAttachmentMeta[]>([]);

  const attachmentIds = stagedAttachments.map((item) => item.id);
  attachmentIdsRef.current = attachmentIds;

  useEffect(() => {
    onCloseRef.current = onClose;
    onSendRef.current = onSend;
  }, [onClose, onSend]);

  useEffect(() => {
    if (!open) {
      setStagedAttachments([]);
    }
  }, [open]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Write your reply… Type // for snippets" }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-sm max-w-none min-h-[120px] px-4 py-3 focus:outline-none [&_p]:my-1",
      },
      handleKeyDown: (view, event) => {
        const text = view.state.doc.textContent;
        if (text.endsWith("//") || (text.includes("//") && !snippetOpen)) {
          const match = text.match(/\/\/(\w*)$/);
          if (match) {
            setSnippetOpen(true);
            setSnippetQuery(match[1] ?? "");
          }
        } else {
          setSnippetOpen(false);
        }

        if (event.key === "Escape") {
          if (snippetOpen) {
            setSnippetOpen(false);
            return true;
          }
          event.preventDefault();
          event.stopPropagation();
          onCloseRef.current();
          return true;
        }

        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
          event.preventDefault();
          const html = editorRef.current?.getHTML() ?? "";
          onSendRef.current(
            html,
            attachmentIdsRef.current.length > 0 ? attachmentIdsRef.current : undefined
          );
          return true;
        }

        if (event.ctrlKey && !event.metaKey && event.key === "y") {
          event.preventDefault();
          editorRef.current?.chain().focus().redo().run();
          return true;
        }

        return false;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (editor && open) {
      editor.commands.setContent(initialContent || "<p></p>");
      setSnippetOpen(false);
    }
  }, [editor, open, initialContent]);

  useEffect(() => {
    if (editor && open && !loading) {
      editor.commands.focus("end");
    }
  }, [editor, open, loading]);

  const filteredSnippets = snippets.filter((s) =>
    s.name.toLowerCase().includes(snippetQuery.toLowerCase())
  );

  const insertSnippet = (snippet: SnippetOption) => {
    if (!editor) return;
    const plain = editor.getText().replace(/\/\/\w*$/, "");
    editor.commands.setContent(snippet.body);
    if (plain.trim()) {
      editor.commands.insertContentAt(0, `<p>${plain}</p>`);
    }
    setSnippetOpen(false);
    editor.commands.focus("end");
  };

  if (!open) return null;

  return (
    <div className="border-t border-hairline bg-canvas">
      {/* Composer header */}
      <div className="flex items-center justify-between border-b border-divider-soft px-4 py-3">
        <div>
          <p className="type-fine text-ink-muted-48 uppercase" style={{ letterSpacing: "0.06em" }}>
            Reply to
          </p>
          <p className="type-caption text-ink mt-0.5 truncate">{subject}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 type-caption text-ink-muted-80 hover:text-ink transition-colors"
        >
          Cancel
          <KbdBadge>Esc</KbdBadge>
        </button>
      </div>

      {snippetOpen && filteredSnippets.length > 0 && (
        <div className="border-b border-divider-soft bg-pearl px-3 py-2">
          {filteredSnippets.slice(0, 5).map((snippet) => (
            <button
              key={snippet.id}
              type="button"
              className="block w-full rounded-[8px] px-3 py-2 text-left type-caption text-ink hover:bg-canvas transition-colors"
              onClick={() => insertSnippet(snippet)}
            >
              <span className="font-mono text-ink-muted-48">//</span>
              {snippet.name}
            </button>
          ))}
        </div>
      )}

      {/* Editor — min-height 180px per spec */}
      <div className="border-b border-divider-soft min-h-[180px]">
        {loading ? (
          <p className="px-4 py-6 type-body text-ink-muted-48">Generating draft…</p>
        ) : (
          <EditorContent
            editor={editor}
            className="[&_.ProseMirror]:min-h-[180px] [&_.ProseMirror]:px-4 [&_.ProseMirror]:py-4 [&_.ProseMirror]:text-[17px] [&_.ProseMirror]:leading-[1.47] [&_.ProseMirror]:text-ink [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-ink-muted-48 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
          />
        )}
      </div>

      {sendTimeSuggestion && (
        <button
          type="button"
          onClick={() => {
            const html = editor?.getHTML() ?? "";
            const ids = attachmentIds.length > 0 ? attachmentIds : undefined;
            if (onOpenSendLater) onOpenSendLater(html, ids);
            else onSendLater?.(html, ids);
          }}
          className="border-b border-divider-soft px-4 py-2 text-left type-caption text-ink-muted-48 w-full hover:bg-pearl transition-colors"
        >
          <span className="text-primary">AI ·</span> Suggested send time:{" "}
          <span className="text-ink-muted-80">
            {new Date(sendTimeSuggestion.suggestedAt).toLocaleString()}
          </span>{" "}
          — {sendTimeSuggestion.reason} (click to schedule)
        </button>
      )}

      {/* Send row */}
      <div className="border-t border-divider-soft px-4 py-2">
        <AttachmentStaging
          attachments={stagedAttachments}
          onChange={setStagedAttachments}
          disabled={loading}
        />
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["professional", "friendly", "brief"] as const).map((tone) => (
            <button
              key={tone}
              type="button"
              disabled={loading}
              onClick={() => onToneChange?.(tone)}
              className="btn-pearl-capsule disabled:opacity-50 capitalize"
            >
              {tone}
            </button>
          ))}
          <span className="type-fine text-ink-muted-48 ml-1">
            <KbdBadge>{modLabel}Z</KbdBadge> undo · // for snippets
          </span>
        </div>
        <div className="flex items-center gap-2">
          {(onSendLater || onOpenSendLater) && (
            <button
              type="button"
              className="btn-pearl-capsule"
              onClick={() => {
                const html = editor?.getHTML() ?? "";
                const ids = attachmentIds.length > 0 ? attachmentIds : undefined;
                if (onOpenSendLater) onOpenSendLater(html, ids);
                else onSendLater?.(html, ids);
              }}
            >
              Send later
            </button>
          )}
          <Button
            onClick={() => {
              const html = editor?.getHTML() ?? "";
              onSend(html, attachmentIds.length > 0 ? attachmentIds : undefined);
            }}
          >
            Send
            <KbdBadge className="!bg-white/15 !text-white/80">{modLabel}↵</KbdBadge>
          </Button>
        </div>
      </div>
    </div>
  );
}
