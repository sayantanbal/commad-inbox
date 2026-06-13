import "server-only";

import { generateText, Output } from "ai";
import type { z } from "zod";
import { getChatModel } from "@/lib/ai/models";
import type { AiProvider } from "@/lib/ai/providers";
import { withProviderFallback } from "@/lib/ai/with-fallback";

export async function generateJsonWithProvider<T>(
  preferred: AiProvider,
  prompt: string,
  system: string,
  schema: z.ZodType<T>
): Promise<{ data: T; provider: AiProvider }> {
  const { result, provider } = await withProviderFallback(preferred, async (activeProvider) => {
    const model = getChatModel(activeProvider);
    if (!model) {
      throw new Error(`${activeProvider} chat model is not configured`);
    }

    const { output } = await generateText({
      model,
      system,
      prompt,
      output: Output.object({ schema }),
      temperature: 0.2,
      maxRetries: 0,
    });

    if (output == null) {
      throw new Error(`${activeProvider} returned empty JSON output`);
    }

    return output;
  });

  return { data: result, provider };
}

export async function generateTextWithProvider(
  preferred: AiProvider,
  prompt: string,
  system: string
): Promise<{ text: string; provider: AiProvider }> {
  const { result, provider } = await withProviderFallback(preferred, async (activeProvider) => {
    const model = getChatModel(activeProvider);
    if (!model) {
      throw new Error(`${activeProvider} chat model is not configured`);
    }

    const { text } = await generateText({
      model,
      system,
      prompt,
      temperature: 0.4,
      maxRetries: 0,
    });

    if (!text?.trim()) {
      throw new Error(`${activeProvider} returned empty text output`);
    }

    return text.trim();
  });

  return { text: result, provider };
}
