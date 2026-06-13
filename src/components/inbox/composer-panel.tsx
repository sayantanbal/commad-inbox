"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface ComposerPanelProps {
  open: boolean;
  subject: string;
  modLabel: string;
  initialContent?: string;
  loading?: boolean;
  onClose: () => void;
  onSend: (body: string) => void;
  onToneChange?: (tone: "professional" | "friendly" | "brief") => void;
  onSendLater?: (body: string) => void;
}

export function ComposerPanel({
  open,
  subject,
  modLabel,
  initialContent = "",
  loading = false,
  onClose,
  onSend,
  onToneChange,
  onSendLater,
}: ComposerPanelProps) {
  const onCloseRef = useRef(onClose);
  const onSendRef = useRef(onSend);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
    onSendRef.current = onSend;
  }, [onClose, onSend]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Write your reply..." }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-sm max-w-none min-h-[120px] px-4 py-3 focus:outline-none [&_p]:my-1",
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onCloseRef.current();
          return true;
        }

        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
          event.preventDefault();
          const html = editorRef.current?.getHTML() ?? "";
          onSendRef.current(html);
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
    }
  }, [editor, open, initialContent]);

  useEffect(() => {
    if (editor && open && !loading) {
      editor.commands.focus("end");
    }
  }, [editor, open, loading]);

  if (!open) return null;

  return (
    <div className="border-t border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div>
          <p className="text-xs text-muted-foreground">Reply to</p>
          <p className="text-sm font-medium">{subject}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
          <kbd className="ml-1 rounded border border-border px-1 font-mono text-[10px] text-muted-foreground">
            Esc
          </kbd>
        </Button>
      </div>

      <div className="border-b border-border">
        {loading ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Generating draft…</p>
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {(["professional", "friendly", "brief"] as const).map((tone) => (
            <Button
              key={tone}
              variant="outline"
              size="sm"
              className="text-xs capitalize"
              disabled={loading}
              onClick={() => onToneChange?.(tone)}
            >
              {tone}
            </Button>
          ))}
          <span className="text-[10px] text-muted-foreground">
            {modLabel}Z undo · {modLabel}⇧Z redo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSendLater ? () => onSendLater(editor?.getHTML() ?? "") : undefined}
          >
            Send later
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const html = editor?.getHTML() ?? "";
              onSend(html);
            }}
          >
            Send
            <kbd className="ml-1 rounded border border-primary-foreground/20 px-1 font-mono text-[10px]">
              {modLabel}↵
            </kbd>
          </Button>
        </div>
      </div>
    </div>
  );
}
