import { generateJsonWithProvider, generateTextWithProvider } from "@/lib/ai/generate";
import { embedWithProvider } from "@/lib/ai/embed";
import { getDefaultProvider } from "@/lib/ai/with-fallback";
import { isRateLimitError } from "@/lib/ai/rate-limit";
import { z } from "zod";

export { isRateLimitError, isRateLimitError as isGeminiQuotaError };

const looseJsonSchema = z.record(z.string(), z.unknown());

/** @deprecated Prefer generateJsonWithProvider */
export async function geminiGenerateJson(
  userId: string,
  prompt: string,
  system: string
): Promise<unknown> {
  const preferred = await getDefaultProvider(userId);
  const { data } = await generateJsonWithProvider(
    userId,
    preferred,
    prompt,
    system,
    looseJsonSchema
  );
  return data;
}

/** @deprecated Prefer generateTextWithProvider */
export async function geminiGenerateText(
  userId: string,
  prompt: string,
  system: string
): Promise<string> {
  const preferred = await getDefaultProvider(userId);
  const { text } = await generateTextWithProvider(userId, preferred, prompt, system);
  return text;
}

/** @deprecated Prefer embedWithProvider */
export async function geminiEmbed(userId: string, text: string): Promise<number[]> {
  const preferred = await getDefaultProvider(userId);
  const { vector } = await embedWithProvider(userId, preferred, text);
  return vector;
}
