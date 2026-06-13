import type { Classification } from "@/lib/types";

export function mergeClassifications(
  current: Classification[],
  incoming: Classification
): Classification[] {
  const next = current.filter((item) => item.threadId !== incoming.threadId);
  return [...next, incoming];
}
