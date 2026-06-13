import "server-only";

import { getConfiguredProviders, isProviderConfigured } from "@/lib/ai/models";
import { DEFAULT_AI_PROVIDER, type AiProvider } from "@/lib/ai/providers";
import { isRateLimitError } from "@/lib/ai/rate-limit";

export function getProviderChain(preferred: AiProvider): AiProvider[] {
  const fallback: AiProvider = preferred === "gemini" ? "openai" : "gemini";
  const chain: AiProvider[] = [];

  if (isProviderConfigured(preferred)) {
    chain.push(preferred);
  }
  if (fallback !== preferred && isProviderConfigured(fallback) && !chain.includes(fallback)) {
    chain.push(fallback);
  }

  return chain;
}

export function getDefaultProvider(): AiProvider {
  const configured = getConfiguredProviders();
  if (configured.includes(DEFAULT_AI_PROVIDER)) {
    return DEFAULT_AI_PROVIDER;
  }
  return configured[0] ?? DEFAULT_AI_PROVIDER;
}

export function resolveAgentModelProvider(preferred: AiProvider): AiProvider {
  const chain = getProviderChain(preferred);
  return chain[0] ?? preferred;
}

export class NoAiProviderError extends Error {
  constructor() {
    super(
      "No AI provider configured. Set GOOGLE_GENERATIVE_AI_API_KEY and/or OPENAI_API_KEY."
    );
    this.name = "NoAiProviderError";
  }
}

export async function withProviderFallback<T>(
  preferred: AiProvider,
  fn: (provider: AiProvider) => Promise<T>
): Promise<{ result: T; provider: AiProvider }> {
  const chain = getProviderChain(preferred);
  if (chain.length === 0) {
    throw new NoAiProviderError();
  }

  let lastError: unknown;
  for (const provider of chain) {
    try {
      const result = await fn(provider);
      return { result, provider };
    } catch (error) {
      lastError = error;
      if (!isRateLimitError(error)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
