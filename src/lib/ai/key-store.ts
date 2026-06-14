import "server-only";

import { and, eq } from "drizzle-orm";
import { embed } from "ai";
import { db } from "@/lib/db";
import { userAiKeys } from "@/lib/db/schema";
import { decryptSecret, encryptSecret, keyHint } from "@/lib/ai/crypto";
import { getEmbeddingModel, isPlatformProviderConfigured } from "@/lib/ai/models";
import { AI_PROVIDER_CONFIG, AI_PROVIDER_IDS, type AiProvider } from "@/lib/ai/providers";
import { env } from "@/lib/env";

export type AiKeyHint = {
  hint: string;
  updatedAt: string;
  source: "user";
};

export type AiKeysStatus = {
  keys: Partial<Record<AiProvider, AiKeyHint>>;
  platform: Record<AiProvider, boolean>;
  available: AiProvider[];
};

function platformApiKey(provider: AiProvider): string | null {
  if (provider === "gemini") {
    return env.GOOGLE_GENERATIVE_AI_API_KEY ?? null;
  }
  return env.OPENAI_API_KEY ?? null;
}

export async function getUserAiKey(userId: string, provider: AiProvider): Promise<string | null> {
  const [row] = await db
    .select()
    .from(userAiKeys)
    .where(and(eq(userAiKeys.userId, userId), eq(userAiKeys.provider, provider)));

  if (!row) return null;

  try {
    return decryptSecret(row.encryptedKey);
  } catch {
    return null;
  }
}

export async function resolveApiKey(userId: string, provider: AiProvider): Promise<string | null> {
  const userKey = await getUserAiKey(userId, provider);
  if (userKey) return userKey;
  return platformApiKey(provider);
}

export async function isProviderAvailable(userId: string, provider: AiProvider): Promise<boolean> {
  return Boolean(await resolveApiKey(userId, provider));
}

export async function getAvailableProviders(userId: string): Promise<AiProvider[]> {
  const available: AiProvider[] = [];
  for (const provider of AI_PROVIDER_IDS) {
    if (await isProviderAvailable(userId, provider)) {
      available.push(provider);
    }
  }
  return available;
}

export async function getUserAiKeyHints(userId: string): Promise<AiKeysStatus> {
  const rows = await db.select().from(userAiKeys).where(eq(userAiKeys.userId, userId));

  const keys: Partial<Record<AiProvider, AiKeyHint>> = {};
  for (const row of rows) {
    if (row.provider !== "gemini" && row.provider !== "openai") continue;
    keys[row.provider] = {
      hint: row.keyHint,
      updatedAt: row.updatedAt.toISOString(),
      source: "user",
    };
  }

  const platform = {
    gemini: isPlatformProviderConfigured("gemini"),
    openai: isPlatformProviderConfigured("openai"),
  } satisfies Record<AiProvider, boolean>;

  const available = await getAvailableProviders(userId);

  return { keys, platform, available };
}

export async function saveUserAiKey(
  userId: string,
  provider: AiProvider,
  apiKey: string
): Promise<AiKeyHint> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new Error("API key is required");
  }

  await validateAiKey(provider, trimmed);

  const encryptedKey = encryptSecret(trimmed);
  const hint = keyHint(trimmed);
  const now = new Date();

  await db
    .insert(userAiKeys)
    .values({
      userId,
      provider,
      encryptedKey,
      keyHint: hint,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [userAiKeys.userId, userAiKeys.provider],
      set: {
        encryptedKey,
        keyHint: hint,
        updatedAt: now,
      },
    });

  return {
    hint,
    updatedAt: now.toISOString(),
    source: "user",
  };
}

export async function deleteUserAiKey(userId: string, provider: AiProvider): Promise<void> {
  await db
    .delete(userAiKeys)
    .where(and(eq(userAiKeys.userId, userId), eq(userAiKeys.provider, provider)));
}

export async function validateAiKey(provider: AiProvider, apiKey: string): Promise<void> {
  const model = getEmbeddingModel(provider, apiKey);
  if (!model) {
    throw new Error(`${provider} model is not available`);
  }

  const { embedding } = await embed({
    model,
    value: "ping",
    providerOptions:
      provider === "openai"
        ? { openai: { dimensions: AI_PROVIDER_CONFIG.openai.dimensions } }
        : { google: { outputDimensionality: AI_PROVIDER_CONFIG.gemini.dimensions } },
  });

  if (!embedding.length) {
    throw new Error("API key validation failed");
  }
}

export async function resolveApiKeySource(
  userId: string,
  provider: AiProvider
): Promise<"user" | "platform" | null> {
  if (await getUserAiKey(userId, provider)) return "user";
  if (platformApiKey(provider)) return "platform";
  return null;
}
