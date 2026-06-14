import { generateJsonWithProvider } from "@/lib/ai/generate";
import { getDefaultProvider } from "@/lib/ai/with-fallback";
import {
  classificationAiOutputSchema,
  sanitizeClassificationResult,
  type ClassificationResult,
} from "@/lib/schemas/domain";
import { inferLaneFromThread, inferPriorityFromThread } from "@/lib/classifier/infer-lane";

export type ClassifyThreadInput = {
  subject: string;
  sender: string;
  snippet: string;
  body: string;
};

export type ClassifyThreadResult = ClassificationResult;

const SYSTEM = `You triage email for a consultant whose inbox is a meeting pipeline.
Return JSON only with keys: priority, lane, schedulingIntent.

priority: high (urgent client/revenue), medium (normal work), low (newsletters/noise)
lane: reply (needs written response), schedule (meeting coordination), fyi (read-only), done (noise/archive)
schedulingIntent: when lane is schedule or email proposes times, include proposedTimes (ISO strings), attendees (emails), duration minutes, confidence 0-1; omit the key entirely when not scheduling

Be decisive: use schedule for any meeting/time coordination; use fyi for newsletters, notifications, and read-only updates; use done only for obvious spam.`;

function heuristicFallback(input: ClassifyThreadInput): ClassificationResult {
  const lane = inferLaneFromThread({
    subject: input.subject,
    snippet: input.snippet,
    sender: input.sender,
  });
  return {
    priority: inferPriorityFromThread({
      subject: input.subject,
      snippet: input.snippet,
      lane,
    }),
    lane,
    schedulingIntent: null,
  };
}

export async function classifyThread(input: ClassifyThreadInput): Promise<ClassifyThreadResult> {
  const body = input.body.slice(0, 2000);
  const prompt = `Subject: ${input.subject}
From: ${input.sender}
Snippet: ${input.snippet}

Body:
${body}`;

  try {
    const { data } = await generateJsonWithProvider(
      getDefaultProvider(),
      prompt,
      SYSTEM,
      classificationAiOutputSchema
    );
    return sanitizeClassificationResult(data);
  } catch (error) {
    console.warn("[classify] AI request failed, using heuristics:", error);
    return heuristicFallback(input);
  }
}
