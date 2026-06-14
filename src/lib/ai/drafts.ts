import { generateTextWithProvider } from "@/lib/ai/generate";
import { getDefaultProvider } from "@/lib/ai/with-fallback";
import type { AiProvider } from "@/lib/ai/providers";
import type { Thread } from "@/lib/types";

function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<p>${escaped.split(/\n\n+/).join("</p><p>")}</p>`;
}

function templateReplyDraft(input: {
  thread: Thread;
  tone: "professional" | "friendly" | "brief";
}): string {
  const subject = input.thread.subject.trim() || "your message";
  const templates = {
    professional: `Thank you for your email regarding "${subject}". I appreciate you reaching out and will follow up with a detailed response shortly.`,
    friendly: `Thanks for reaching out about "${subject}"! I saw your note and will get back to you soon.`,
    brief: `Thanks — received your message on "${subject}". I'll follow up shortly.`,
  };
  return templates[input.tone];
}

export async function generateReplyDraft(input: {
  userId: string;
  thread: Thread;
  tone: "professional" | "friendly" | "brief";
  provider?: AiProvider;
}): Promise<{ draftHtml: string; source: "ai" | "template" }> {
  const preferred = input.provider ?? (await getDefaultProvider(input.userId));

  try {
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

    const { text: draft } = await generateTextWithProvider(
      input.userId,
      preferred,
      prompt,
      "You draft email replies. Plain text only, no subject line or signature block."
    );
    return { draftHtml: textToHtml(draft), source: "ai" };
  } catch (error) {
    console.warn("[draft] AI providers unavailable, using template:", error);
    return { draftHtml: textToHtml(templateReplyDraft(input)), source: "template" };
  }
}

export async function generateConfirmationDraft(input: {
  userId: string;
  thread: Thread;
  slotStart: Date;
  durationMinutes: number;
  hangoutLink?: string;
  provider?: AiProvider;
}): Promise<string> {
  const { format } = await import("date-fns");
  const when = format(input.slotStart, "EEEE, MMMM d 'at' h:mm a");
  const preferred = input.provider ?? (await getDefaultProvider(input.userId));

  try {
    const prompt = `Thread subject: ${input.thread.subject}
Latest message:
${input.thread.messages.at(-1)?.body ?? input.thread.snippet}

Meeting time: ${when} (${input.durationMinutes} minutes)
${input.hangoutLink ? `Google Meet: ${input.hangoutLink}` : ""}

Write a short confirmation reply (2-4 sentences, professional tone). Return plain text only.`;

    const { text: draft } = await generateTextWithProvider(
      input.userId,
      preferred,
      prompt,
      "You draft concise meeting confirmation emails. Plain text only, no subject line."
    );
    return textToHtml(draft);
  } catch (error) {
    console.warn("[draft] confirmation AI unavailable, using template:", error);
    const meet = input.hangoutLink ? `\n\nMeet link: ${input.hangoutLink}` : "";
    return textToHtml(
      `Thank you — I've sent a calendar invite for ${when}.${meet}\n\nLooking forward to speaking with you.`
    );
  }
}
