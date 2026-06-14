import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import {
  computeBriefSourceHash,
  getCachedDailyBrief,
  saveDailyBriefCache,
} from "@/lib/ai/daily-brief-cache";
import { generateDailyBrief, streamDailyBrief } from "@/lib/ai/daily-brief";
import { getClassificationsForUser } from "@/lib/corsair/classifications";
import { fetchEventsForTenant } from "@/lib/corsair/events";
import { fetchThreadsForTenant } from "@/lib/corsair/threads";
import { assertAiAvailable } from "@/lib/ai/runtime";
import { aiErrorResponse } from "@/lib/api/ai-error-response";
import { DEFAULT_AI_PROVIDER } from "@/lib/ai/providers";
import { dailyBriefBodySchema } from "@/lib/schemas/api";
import type { DailyBrief } from "@/lib/schemas/domain";

export const maxDuration = 60;

type StreamEvent =
  | { type: "status"; message: string }
  | { type: "partial"; brief: Partial<DailyBrief> }
  | { type: "complete"; brief: DailyBrief; provider: string; source: "ai" | "cache" }
  | { type: "error"; message: string };

function encodeEvent(event: StreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  try {
    await assertAiAvailable(auth.userId);
  } catch (error) {
    const response = aiErrorResponse(error);
    if (response) return response;
    const message = error instanceof Error ? error.message : "AI not configured";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const parsed = await parseJsonBody(request, dailyBriefBodySchema, { allowEmpty: true });
  if (!parsed.ok) return parsed.response;

  const provider = parsed.data.provider ?? DEFAULT_AI_PROVIDER;
  const refresh = parsed.data.refresh ?? false;
  const stream = parsed.data.stream ?? false;
  const timezone = parsed.data.timezone ?? "UTC";

  const briefParams = {
    userName: auth.userEmail.split("@")[0] ?? "",
    userEmail: auth.userEmail,
    timezone,
  };

  if (stream) {
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: StreamEvent) => controller.enqueue(encodeEvent(event));

        try {
          send({ type: "status", message: "Reading calendar…" });
          const eventsPromise = fetchEventsForTenant(auth.tenant);
          send({ type: "status", message: "Scanning inbox…" });
          const [threads, classifications, events] = await Promise.all([
            fetchThreadsForTenant(auth.tenant),
            getClassificationsForUser(auth.userId),
            eventsPromise,
          ]);

          const sourceHash = computeBriefSourceHash(threads, classifications, events);

          if (!refresh) {
            const cached = await getCachedDailyBrief(auth.userId, sourceHash);
            if (cached) {
              send({
                type: "complete",
                brief: cached.brief,
                provider: cached.provider ?? provider,
                source: "cache",
              });
              controller.close();
              return;
            }
          }

          send({ type: "status", message: "Writing your brief…" });

          const { brief, provider: used } = await streamDailyBrief(
            auth.userId,
            { ...briefParams, threads, classifications, events },
            provider,
            (partial) => send({ type: "partial", brief: partial })
          );

          await saveDailyBriefCache(auth.userId, sourceHash, brief, used);

          send({ type: "complete", brief, provider: used, source: "ai" });
          controller.close();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Daily brief failed";
          send({ type: "error", message });
          controller.close();
        }
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  }

  try {
    const [threads, classifications, events] = await Promise.all([
        fetchThreadsForTenant(auth.tenant),
        getClassificationsForUser(auth.userId),
        fetchEventsForTenant(auth.tenant),
      ]);

      const sourceHash = computeBriefSourceHash(threads, classifications, events);

      if (!refresh) {
        const cached = await getCachedDailyBrief(auth.userId, sourceHash);
        if (cached) {
          return NextResponse.json({
            brief: cached.brief,
            provider: cached.provider,
            source: "cache",
          });
        }
      }

      const { brief, provider: used } = await generateDailyBrief(
        auth.userId,
        { ...briefParams, threads, classifications, events },
        provider
      );

      await saveDailyBriefCache(auth.userId, sourceHash, brief, used);

      return NextResponse.json({ brief, provider: used, source: "ai" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Daily brief failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
