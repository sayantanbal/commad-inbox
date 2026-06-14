import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { getUserPreferences, updateUserPreferences } from "@/lib/focus/window";
import { workingDaysToAiSummary } from "@/lib/preferences/sanitize-working-days";
import { preferencesPatchBodySchema } from "@/lib/schemas/api";

function serializePreferences(prefs: Awaited<ReturnType<typeof getUserPreferences>>) {
  return {
    batchWindows: prefs.batchWindows,
    focusModeEnabled: prefs.focusModeEnabled,
    autoResponderTemplate: prefs.autoResponderTemplate,
    followUpDaysDefault: prefs.followUpDaysDefault,
    timezone: prefs.timezone,
    workingDaysStructured: prefs.workingDaysStructured,
    workingDaysTextOverride: prefs.workingDaysTextOverride,
    workingDaysSource: prefs.workingDaysSource,
    onboardingCompletedAt: prefs.onboardingCompletedAt?.toISOString() ?? null,
    workingDaysSummary: workingDaysToAiSummary(
      prefs.workingDaysStructured,
      prefs.workingDaysTextOverride
    ),
  };
}

export async function GET() {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const prefs = await getUserPreferences(auth.userId);
  return NextResponse.json(serializePreferences(prefs));
}

export async function PATCH(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, preferencesPatchBodySchema);
  if (!parsed.ok) return parsed.response;

  const { onboardingCompletedAt, ...rest } = parsed.data;
  await updateUserPreferences(auth.userId, {
    ...rest,
    ...(onboardingCompletedAt !== undefined
      ? { onboardingCompletedAt: onboardingCompletedAt ? new Date(onboardingCompletedAt) : null }
      : {}),
  });

  const prefs = await getUserPreferences(auth.userId);
  return NextResponse.json(serializePreferences(prefs));
}
