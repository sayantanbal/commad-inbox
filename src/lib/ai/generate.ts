import "server-only";

import { generateText, Output, streamText } from "ai";
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

    const validated = schema.safeParse(output);
    if (!validated.success) {
      throw new Error(
        `${activeProvider} returned JSON that failed schema validation: ${validated.error.message}`
      );
    }

    return validated.data;
  });

  return { data: result, provider };
}

export async function streamJsonWithProvider<T>(
  preferred: AiProvider,
  prompt: string,
  system: string,
  schema: z.ZodType<T>,
  onPartial: (partial: Partial<T>) => void
): Promise<{ data: T; provider: AiProvider }> {
  const { result, provider } = await withProviderFallback(preferred, async (activeProvider) => {
    const model = getChatModel(activeProvider);
    if (!model) {
      throw new Error(`${activeProvider} chat model is not configured`);
    }

    const stream = streamText({
      model,
      system,
      prompt,
      output: Output.object({ schema }),
      temperature: 0.2,
      maxRetries: 0,
    });

    let latest: Partial<T> = {};
    for await (const partial of stream.partialOutputStream) {
      latest = partial as Partial<T>;
      onPartial(latest);
    }

    const output = await stream.output;
    if (output == null) {
      throw new Error(`${activeProvider} returned empty JSON output`);
    }

    const validated = schema.safeParse(output);
    if (!validated.success) {
      throw new Error(
        `${activeProvider} returned JSON that failed schema validation: ${validated.error.message}`
      );
    }

    return validated.data;
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
