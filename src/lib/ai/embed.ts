import "server-only";

import { embed } from "ai";
import { getEmbeddingModel } from "@/lib/ai/models";
import { AI_PROVIDER_CONFIG, type AiProvider } from "@/lib/ai/providers";
import { withProviderFallback } from "@/lib/ai/with-fallback";

export async function embedWithProvider(
  preferred: AiProvider,
  text: string
): Promise<{ vector: number[]; provider: AiProvider }> {
  const { result, provider } = await withProviderFallback(preferred, async (activeProvider) => {
    const model = getEmbeddingModel(activeProvider);
    if (!model) {
      throw new Error(`${activeProvider} embedding model is not configured`);
    }

    const { embedding } = await embed({
      model,
      value: text,
      providerOptions:
        activeProvider === "openai"
          ? {
              openai: { dimensions: AI_PROVIDER_CONFIG.openai.dimensions },
            }
          : {
              google: {
                outputDimensionality: AI_PROVIDER_CONFIG.gemini.dimensions,
              },
            },
    });

    if (!embedding.length) {
      throw new Error(`${activeProvider} returned an empty embedding`);
    }

    return embedding;
  });

  return { vector: result, provider };
}
