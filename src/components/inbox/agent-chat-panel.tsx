"use client";

import { useState } from "react";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const starterMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      'Try: "Send a calendar invite to friend@corsair.dev at 9 AM next Thursday, and email him saying I look forward to it"',
  },
];

export function AgentChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: input.trim() };
    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: `a-${Date.now()}`,
        role: "assistant",
        content:
          "I'll need your approval before sending the invite and email. (MCP wiring comes in Phase 5.)",
      },
    ]);
    setInput("");
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-card">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Bot className="h-4 w-4 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">Agent</p>
          <p className="truncate text-[10px] text-muted-foreground">
            Natural language for email + calendar
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3 p-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "rounded-lg px-3 py-2 text-sm",
                msg.role === "user"
                  ? "ml-6 bg-primary/15 text-foreground"
                  : "mr-2 bg-secondary text-secondary-foreground"
              )}
            >
              {msg.content}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask the agent…"
            className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button size="icon" onClick={handleSend} aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
