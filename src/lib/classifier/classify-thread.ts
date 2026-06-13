import { z } from "zod";
import { geminiGenerateJson } from "@/lib/ai/gemini";
import type { Priority, TriageLane } from "@/lib/types";
import type { SchedulingIntent } from "@/lib/db/schema";

const classificationResultSchema = z.object({
  priority: z.enum(["high", "medium", "low"]),
  lane: z.enum(["reply", "schedule", "fyi", "done"]),
  schedulingIntent: z
    .object({
      proposedTimes: z.array(z.string()),
      attendees: z.array(z.string()),
      duration: z.number().int().positive(),
      confidence: z.number().min(0).max(1),
    })
    .nullable(),
});

export type ClassifyThreadInput = {
  subject: string;
  sender: string;
  snippet: string;
  body: string;
};

export type ClassifyThreadResult = {
  priority: Priority;
  lane: TriageLane;
  schedulingIntent: SchedulingIntent | null;
};

const SYSTEM = `You triage email for a consultant whose inbox is a meeting pipeline.
Return JSON only with keys: priority, lane, schedulingIntent.

priority: high (urgent client/revenue), medium (normal work), low (newsletters/noise)
lane: reply (needs written response), schedule (meeting coordination), fyi (read-only), done (noise/archive)
schedulingIntent: when lane is schedule or email proposes times, include proposedTimes (ISO strings), attendees (emails), duration minutes, confidence 0-1; else null`;

export async function classifyThread(input: ClassifyThreadInput): Promise<ClassifyThreadResult> {
  const body = input.body.slice(0, 2000);
  const prompt = `Subject: ${input.subject}
From: ${input.sender}
Snippet: ${input.snippet}

Body:
${body}`;

  const raw = await geminiGenerateJson<unknown>(prompt, SYSTEM);
  const parsed = classificationResultSchema.parse(raw);

  return {
    priority: parsed.priority,
    lane: parsed.lane,
    schedulingIntent: parsed.schedulingIntent,
  };
}
