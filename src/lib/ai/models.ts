import "server-only";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { env } from "@/lib/env";
import { AI_PROVIDER_CONFIG, type AiProvider } from "@/lib/ai/providers";

export function isPlatformProviderConfigured(provider: AiProvider): boolean {
  if (provider === "gemini") {
    return Boolean(env.GOOGLE_GENERATIVE_AI_API_KEY);
  }
  return Boolean(env.OPENAI_API_KEY);
}

/** @deprecated Use isPlatformProviderConfigured or isProviderAvailable(userId, provider) */
export function isProviderConfigured(provider: AiProvider): boolean {
  return isPlatformProviderConfigured(provider);
}

/** @deprecated Use getAvailableProviders(userId) */
export function getConfiguredProviders(): AiProvider[] {
  const order: AiProvider[] = ["gemini", "openai"];
  return order.filter(isPlatformProviderConfigured);
}

export function getChatModel(provider: AiProvider, apiKey?: string) {
  const { chatModel } = AI_PROVIDER_CONFIG[provider];

  if (provider === "gemini") {
    if (apiKey) {
      return createGoogleGenerativeAI({ apiKey })(chatModel);
    }
    if (!isPlatformProviderConfigured("gemini")) return null;
    return google(chatModel);
  }

  if (apiKey) {
    return createOpenAI({ apiKey })(chatModel);
  }
  if (!isPlatformProviderConfigured("openai")) return null;
  return openai(chatModel);
}

export function getEmbeddingModel(provider: AiProvider, apiKey?: string) {
  const { embedModel } = AI_PROVIDER_CONFIG[provider];

  if (provider === "gemini") {
    if (apiKey) {
      return createGoogleGenerativeAI({ apiKey }).embeddingModel(embedModel);
    }
    if (!isPlatformProviderConfigured("gemini")) return null;
    return google.embeddingModel(embedModel);
  }

  if (apiKey) {
    return createOpenAI({ apiKey }).embedding(embedModel);
  }
  if (!isPlatformProviderConfigured("openai")) return null;
  return openai.embedding(embedModel);
}
