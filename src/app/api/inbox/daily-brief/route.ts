import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import {
  computeBriefSourceHash,
  getCachedDailyBrief,
  saveDailyBriefCache,
} from "@/lib/ai/daily-brief-cache";
import { generateDailyBrief } from "@/lib/ai/daily-brief";
import { getClassificationsForUser } from "@/lib/corsair/classifications";
import { fetchEventsForTenant } from "@/lib/corsair/events";
import { fetchThreadsForTenant } from "@/lib/corsair/threads";
import { assertPhase2Env } from "@/lib/env";
import { parseAiProvider } from "@/lib/ai/providers";
import { z } from "zod";

const dailyBriefBodySchema = z.object({
  provider: z.enum(["openai", "gemini"]).optional(),
  refresh: z.boolean().optional(),
  timezone: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  try {
    assertPhase2Env();
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI not configured";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  let provider = parseAiProvider("openai");
  let refresh = false;
  let timezone = "UTC";

  const parsed = await parseJsonBody(request, dailyBriefBodySchema);
  if (parsed.ok) {
    provider = parseAiProvider(parsed.data.provider, provider);
    refresh = parsed.data.refresh ?? false;
    timezone = parsed.data.timezone ?? timezone;
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
      {
        userName: auth.userEmail.split("@")[0] ?? "",
        userEmail: auth.userEmail,
        threads,
        classifications,
        events,
        timezone,
      },
      provider
    );

    await saveDailyBriefCache(auth.userId, sourceHash, brief, used);

    return NextResponse.json({ brief, provider: used, source: "ai" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Daily brief failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
