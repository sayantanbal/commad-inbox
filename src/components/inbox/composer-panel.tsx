"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ComposerPanelProps {
  open: boolean;
  subject: string;
  modLabel: string;
  initialContent?: string;
  onClose: () => void;
  onSend: (body: string) => void;
  onSendLater?: () => void;
}

export function ComposerPanel({
  open,
  subject,
  modLabel,
  initialContent = "",
  onClose,
  onSend,
  onSendLater,
}: ComposerPanelProps) {
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
    },
  });

  useEffect(() => {
    if (editor && open) {
      editor.commands.setContent(initialContent || "<p></p>");
    }
  }, [editor, open, initialContent]);

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
        </Button>
      </div>

      <div className="border-b border-border">
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex gap-1">
          {(["Professional", "Friendly", "Brief"] as const).map((tone) => (
            <Button key={tone} variant="outline" size="sm" className="text-xs">
              {tone}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSendLater}>
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
