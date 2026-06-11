/** Corsair decrypts integration credentials with CORSAIR_KEK — mismatch yields this Node crypto error. */
export function isKekMismatchError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Unsupported state or unable to authenticate data");
}

export const KEK_MISMATCH_HINT =
  "Corsair credentials were encrypted with a different CORSAIR_KEK. Run: bun run corsair:reset";
