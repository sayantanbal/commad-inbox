import type { UIMessage } from "ai";

export const WELCOME_MESSAGE_ID = "welcome";

export function isPersistableAgentMessage(message: UIMessage): boolean {
  return (
    (message.role === "user" || message.role === "assistant") &&
    message.id !== WELCOME_MESSAGE_ID
  );
}
