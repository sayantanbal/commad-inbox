import { format } from "date-fns";
import { geminiGenerateText } from "@/lib/ai/gemini";
import type { Thread } from "@/lib/types";

function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<p>${escaped.split(/\n\n+/).join("</p><p>")}</p>`;
}

export async function generateConfirmationDraft(input: {
  thread: Thread;
  slotStart: Date;
  durationMinutes: number;
  hangoutLink?: string;
}): Promise<string> {
  const when = format(input.slotStart, "EEEE, MMMM d 'at' h:mm a");
  const prompt = `Thread subject: ${input.thread.subject}
Latest message:
${input.thread.messages.at(-1)?.body ?? input.thread.snippet}

Meeting time: ${when} (${input.durationMinutes} minutes)
${input.hangoutLink ? `Google Meet: ${input.hangoutLink}` : ""}

Write a short confirmation reply (2-4 sentences, professional tone). Return plain text only.`;

  const draft = await geminiGenerateText(
    prompt,
    "You draft concise meeting confirmation emails. Plain text only, no subject line."
  );
  return textToHtml(draft);
}

export async function generateReplyDraft(input: {
  thread: Thread;
  tone: "professional" | "friendly" | "brief";
}): Promise<string> {
  const toneGuide = {
    professional: "formal and courteous",
    friendly: "warm and conversational",
    brief: "minimal, under 3 sentences",
  }[input.tone];

  const prompt = `Thread subject: ${input.thread.subject}
Conversation:
${input.thread.messages
  .slice(-3)
  .map((message) => `${message.from.name}: ${message.body}`)
  .join("\n\n")}

Write a ${toneGuide} reply. Plain text only.`;

  const draft = await geminiGenerateText(
    prompt,
    "You draft email replies. Plain text only, no subject line or signature block."
  );
  return textToHtml(draft);
}
