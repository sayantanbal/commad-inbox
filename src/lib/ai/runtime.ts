import "server-only";

import { AI_NOT_CONFIGURED_MESSAGE, type AiProvider } from "@/lib/ai/providers";

export type AiRuntime = {
  userId: string;
  preferred?: AiProvider;
};

export { AI_NOT_CONFIGURED_MESSAGE };

export class AiNotConfiguredError extends Error {
  constructor(message = AI_NOT_CONFIGURED_MESSAGE) {
    super(message);
    this.name = "AiNotConfiguredError";
  }
}

export async function assertAiAvailable(userId: string): Promise<void> {
  const { getAvailableProviders } = await import("@/lib/ai/key-store");
  const available = await getAvailableProviders(userId);
  if (available.length === 0) {
    throw new AiNotConfiguredError();
  }
}
