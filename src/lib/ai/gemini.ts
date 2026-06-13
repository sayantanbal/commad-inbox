import { generateJsonWithProvider, generateTextWithProvider } from "@/lib/ai/generate";
import { embedWithProvider } from "@/lib/ai/embed";
import { getDefaultProvider } from "@/lib/ai/with-fallback";
import { isRateLimitError } from "@/lib/ai/rate-limit";
import { z } from "zod";

export { isRateLimitError, isRateLimitError as isGeminiQuotaError };

const looseJsonSchema = z.record(z.string(), z.unknown());

/** @deprecated Prefer generateJsonWithProvider */
export async function geminiGenerateJson(prompt: string, system: string): Promise<unknown> {
  const { data } = await generateJsonWithProvider(
    getDefaultProvider(),
    prompt,
    system,
    looseJsonSchema
  );
  return data;
}

/** @deprecated Prefer generateTextWithProvider */
export async function geminiGenerateText(prompt: string, system: string): Promise<string> {
  const { text } = await generateTextWithProvider(getDefaultProvider(), prompt, system);
  return text;
}

/** @deprecated Prefer embedWithProvider */
export async function geminiEmbed(text: string): Promise<number[]> {
  const { vector } = await embedWithProvider(getDefaultProvider(), text);
  return vector;
}
