import "server-only";

import { getAvailableProviders, resolveApiKey } from "@/lib/ai/key-store";
import { DEFAULT_AI_PROVIDER, type AiProvider } from "@/lib/ai/providers";
import { isRateLimitError } from "@/lib/ai/rate-limit";
import { AiNotConfiguredError } from "@/lib/ai/runtime";

export async function getProviderChain(
  userId: string,
  preferred: AiProvider
): Promise<AiProvider[]> {
  const fallback: AiProvider = preferred === "gemini" ? "openai" : "gemini";
  const chain: AiProvider[] = [];

  if (await resolveApiKey(userId, preferred)) {
    chain.push(preferred);
  }
  if (
    fallback !== preferred &&
    (await resolveApiKey(userId, fallback)) &&
    !chain.includes(fallback)
  ) {
    chain.push(fallback);
  }

  return chain;
}

export async function getDefaultProvider(userId: string): Promise<AiProvider> {
  const configured = await getAvailableProviders(userId);
  if (configured.includes(DEFAULT_AI_PROVIDER)) {
    return DEFAULT_AI_PROVIDER;
  }
  return configured[0] ?? DEFAULT_AI_PROVIDER;
}

export async function resolveAgentModelProvider(
  userId: string,
  preferred: AiProvider
): Promise<AiProvider> {
  const chain = await getProviderChain(userId, preferred);
  return chain[0] ?? preferred;
}

export class NoAiProviderError extends AiNotConfiguredError {
  constructor() {
    super();
    this.name = "NoAiProviderError";
  }
}

export async function withProviderFallback<T>(
  userId: string,
  preferred: AiProvider,
  fn: (provider: AiProvider, apiKey: string) => Promise<T>
): Promise<{ result: T; provider: AiProvider }> {
  const chain = await getProviderChain(userId, preferred);
  if (chain.length === 0) {
    throw new NoAiProviderError();
  }

  let lastError: unknown;
  for (const provider of chain) {
    const apiKey = await resolveApiKey(userId, provider);
    if (!apiKey) continue;

    try {
      const result = await fn(provider, apiKey);
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
