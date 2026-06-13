import type { AiProvider } from "@/lib/ai/providers";

/** Client-safe — does not read process.env. */
export function getAlternateProvider(preferred: AiProvider): AiProvider {
  return preferred === "gemini" ? "openai" : "gemini";
}
