import { env } from "@/lib/env";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const CLASSIFY_MODEL = "gemini-2.0-flash";
const EMBED_MODEL = "text-embedding-004";

function apiKey(): string {
  if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is required for Phase 2 AI features");
  }
  return env.GOOGLE_GENERATIVE_AI_API_KEY;
}

export function isGeminiQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("(429)") || message.includes("RESOURCE_EXHAUSTED");
}

export async function geminiGenerateJson<T>(prompt: string, system: string): Promise<T> {
  const url = `${GEMINI_BASE}/models/${CLASSIFY_MODEL}:generateContent?key=${apiKey()}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: system }] },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini classify failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) {
    throw new Error("Gemini returned empty classification response");
  }
  return JSON.parse(raw) as T;
}

export async function geminiGenerateText(prompt: string, system: string): Promise<string> {
  const url = `${GEMINI_BASE}/models/${CLASSIFY_MODEL}:generateContent?key=${apiKey()}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: system }] },
      generationConfig: { temperature: 0.4 },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini generate failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!raw) {
    throw new Error("Gemini returned empty text response");
  }
  return raw;
}

export async function geminiEmbed(text: string): Promise<number[]> {
  const url = `${GEMINI_BASE}/models/${EMBED_MODEL}:embedContent?key=${apiKey()}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text }] },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini embed failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    embedding?: { values?: number[] };
  };
  const values = data.embedding?.values;
  if (!values?.length) {
    throw new Error("Gemini returned empty embedding");
  }
  return values;
}
