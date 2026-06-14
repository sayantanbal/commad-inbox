"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface MentionContact {
  email: string;
  displayName: string;
}

interface AgentMentionInputProps {
  value: string;
  mentions: MentionContact[];
  contacts: MentionContact[];
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string, mentions: MentionContact[]) => void;
  onSubmit: () => void;
}

function fuzzyMatch(query: string, contact: MentionContact): boolean {
  const q = query.toLowerCase();
  return (
    contact.email.toLowerCase().includes(q) ||
    contact.displayName.toLowerCase().includes(q)
  );
}

export function AgentMentionInput({
  value,
  mentions,
  contacts,
  disabled,
  placeholder = "Ask the agent…",
  onChange,
  onSubmit,
}: AgentMentionInputProps) {
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!mentionQuery) return contacts.slice(0, 8);
    return contacts.filter((c) => fuzzyMatch(mentionQuery, c)).slice(0, 8);
  }, [contacts, mentionQuery]);

  const detectMention = useCallback((text: string, cursor: number) => {
    const before = text.slice(0, cursor);
    const match = before.match(/@([\w.+-]*)$/);
    if (match) {
      setMentionOpen(true);
      setMentionQuery(match[1] ?? "");
      setHighlightIndex(0);
      return;
    }
    setMentionOpen(false);
    setMentionQuery("");
  }, []);

  const insertMention = (contact: MentionContact) => {
    const input = inputRef.current;
    if (!input) return;
    const cursor = input.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const after = value.slice(cursor);
    const atIndex = before.lastIndexOf("@");
    const chipLabel = `@${contact.displayName || contact.email.split("@")[0]}`;
    const nextValue = `${before.slice(0, atIndex)}${chipLabel} ${after}`;
    const nextMentions = mentions.some((m) => m.email === contact.email)
      ? mentions
      : [...mentions, contact];
    onChange(nextValue.trimStart(), nextMentions);
    setMentionOpen(false);
    setMentionQuery("");
    requestAnimationFrame(() => input.focus());
  };

  useEffect(() => {
    if (highlightIndex >= filtered.length) setHighlightIndex(0);
  }, [filtered.length, highlightIndex]);

  return (
    <div className="relative flex-1">
      {mentions.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1">
          {mentions.map((m) => (
            <span
              key={m.email}
              className="inline-flex items-center rounded-full border border-primary/30 bg-[rgba(0,102,204,0.08)] px-2 py-0.5 type-fine text-primary"
            >
              @{m.displayName || m.email}
            </span>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value, mentions);
          detectMention(e.target.value, e.target.selectionStart ?? e.target.value.length);
        }}
        onKeyDown={(e) => {
          if (mentionOpen && filtered.length > 0) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightIndex((i) => Math.max(i - 1, 0));
              return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
              e.preventDefault();
              insertMention(filtered[highlightIndex]!);
              return;
            }
            if (e.key === "Escape") {
              setMentionOpen(false);
              return;
            }
          }
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        className="w-full bg-transparent type-body text-ink outline-none placeholder:text-ink-muted-48 disabled:opacity-60"
      />
      {mentionOpen && filtered.length > 0 && (
        <div className="absolute bottom-full left-0 z-50 mb-1 max-h-48 w-full overflow-auto rounded-lg border border-hairline bg-popover shadow-lg">
          {filtered.map((contact, index) => (
            <button
              key={contact.email}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(contact);
              }}
              className={cn(
                "flex w-full flex-col px-3 py-2 text-left hover:bg-pearl",
                index === highlightIndex && "bg-pearl"
              )}
            >
              <span className="type-caption text-ink">{contact.displayName || contact.email}</span>
              <span className="type-fine text-ink-muted-48">{contact.email}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
