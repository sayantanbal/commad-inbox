import type { AiProvider } from "@/lib/ai/providers";

export async function requestReembed(provider: AiProvider): Promise<{
  status: "started" | "running" | "nothing-to-do";
  total?: number;
}> {
  const response = await fetch("/api/inbox/reembed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider }),
  });

  if (!response.ok) {
    throw new Error("Re-embed request failed");
  }

  const data = (await response.json()) as {
    status: "started" | "running" | "nothing-to-do";
    total?: number;
  };

  return data;
}
