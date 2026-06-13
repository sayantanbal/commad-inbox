import "server-only";

import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { env } from "@/lib/env";
import { AI_PROVIDER_CONFIG, type AiProvider } from "@/lib/ai/providers";

export function isProviderConfigured(provider: AiProvider): boolean {
  if (provider === "gemini") {
    return Boolean(env.GOOGLE_GENERATIVE_AI_API_KEY);
  }
  return Boolean(env.OPENAI_API_KEY);
}

export function getConfiguredProviders(): AiProvider[] {
  const order: AiProvider[] = ["openai", "gemini"];
  return order.filter(isProviderConfigured);
}

export function getChatModel(provider: AiProvider) {
  if (!isProviderConfigured(provider)) {
    return null;
  }

  const { chatModel } = AI_PROVIDER_CONFIG[provider];
  if (provider === "gemini") {
    return google(chatModel);
  }
  return openai(chatModel);
}

export function getEmbeddingModel(provider: AiProvider) {
  if (!isProviderConfigured(provider)) {
    return null;
  }

  const { embedModel } = AI_PROVIDER_CONFIG[provider];
  if (provider === "gemini") {
    return google.embeddingModel(embedModel);
  }
  return openai.embedding(embedModel);
}
