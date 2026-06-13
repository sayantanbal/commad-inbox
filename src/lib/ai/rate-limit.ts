function checkRateLimitSignal(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (
    message.includes("(429)") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    lower.includes("rate limit") ||
    lower.includes("quota") ||
    lower.includes("insufficient_quota") ||
    lower.includes("too many requests") ||
    lower.includes("prepayment credits") ||
    lower.includes("billing") ||
    lower.includes("exceeded your current quota")
  ) {
    return true;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (record.statusCode === 429 || record.status === 429) return true;
    if (record.status === "RESOURCE_EXHAUSTED") return true;

    const data = record.data;
    if (data && typeof data === "object") {
      const nested = data as Record<string, unknown>;
      const nestedError = nested.error;
      if (nestedError && typeof nestedError === "object") {
        const errObj = nestedError as Record<string, unknown>;
        if (errObj.code === 429 || errObj.status === "RESOURCE_EXHAUSTED") return true;
      }
    }
  }

  return false;
}

export function isRateLimitError(error: unknown): boolean {
  let current: unknown = error;

  for (let depth = 0; depth < 6 && current != null; depth += 1) {
    if (checkRateLimitSignal(current)) return true;

    if (current instanceof Error && current.cause != null) {
      current = current.cause;
      continue;
    }

    if (typeof current === "object" && "cause" in current) {
      current = (current as { cause: unknown }).cause;
      continue;
    }

    if (typeof current === "object" && "lastError" in current) {
      current = (current as { lastError: unknown }).lastError;
      continue;
    }

    break;
  }

  return false;
}

/** @deprecated Use isRateLimitError */
export const isGeminiQuotaError = isRateLimitError;
