import "server-only";

import { generateTextWithProvider } from "@/lib/ai/generate";
import { getDefaultProvider } from "@/lib/ai/with-fallback";
import { getUserPreferences } from "@/lib/focus/window";

export const FOLLOW_UP_SYSTEM = `Write a brief, professional follow-up email body (HTML with <p> tags only).
The other party promised something but has not replied. Reference the commitment naturally. 2-3 sentences max.`;

export async function generateFollowUpDraftHtml(
  userId: string,
  input: {
    text: string;
    counterpartyEmail: string;
    followUpDaysDefault?: number;
  }
): Promise<string> {
  const prefs = await getUserPreferences(userId);
  const days = input.followUpDaysDefault ?? prefs.followUpDaysDefault;
  const prompt = `Commitment: "${input.text}"\nCounterparty: ${input.counterpartyEmail}\nDays waiting: ${days}`;
  const preferred = await getDefaultProvider(userId);
  const { text } = await generateTextWithProvider(userId, preferred, prompt, FOLLOW_UP_SYSTEM);
  return text;
}
