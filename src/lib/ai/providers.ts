export const AI_PROVIDER_IDS = ["openai", "gemini"] as const;

export type AiProvider = (typeof AI_PROVIDER_IDS)[number];

export const EMBEDDING_DIMENSIONS = 768;

export const AI_PROVIDER_CONFIG = {
  gemini: {
    label: "Gemini",
    chatLabel: "Gemini 2.5 Flash",
    chatModel: "gemini-2.5-flash",
    embedModel: "text-embedding-004",
    dimensions: EMBEDDING_DIMENSIONS,
  },
  openai: {
    label: "OpenAI",
    chatLabel: "GPT-5 Nano",
    chatModel: "gpt-5-nano",
    embedModel: "text-embedding-3-small",
    dimensions: EMBEDDING_DIMENSIONS,
  },
} as const satisfies Record<
  AiProvider,
  {
    label: string;
    chatLabel: string;
    chatModel: string;
    embedModel: string;
    dimensions: number;
  }
>;

export const AI_PROVIDER_STORAGE_KEY = "command-inbox-ai-provider-v2";
export const DEFAULT_AI_PROVIDER: AiProvider = "openai";

export function isAiProvider(value: string): value is AiProvider {
  return AI_PROVIDER_IDS.includes(value as AiProvider);
}

export function parseAiProvider(value: unknown, fallback: AiProvider = DEFAULT_AI_PROVIDER): AiProvider {
  return typeof value === "string" && isAiProvider(value) ? value : fallback;
}
