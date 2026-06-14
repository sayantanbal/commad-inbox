import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireSessionApi } from "@/lib/api/require-session";
import { getUserPreferences, updateUserPreferences } from "@/lib/focus/window";
import { preferencesPatchBodySchema } from "@/lib/schemas/api";

export async function GET() {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const prefs = await getUserPreferences(auth.userId);
  return NextResponse.json({
    batchWindows: prefs.batchWindows,
    focusModeEnabled: prefs.focusModeEnabled,
    autoResponderTemplate: prefs.autoResponderTemplate,
    followUpDaysDefault: prefs.followUpDaysDefault,
    timezone: prefs.timezone,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireSessionApi();
  if ("error" in auth) return auth.error;

  const parsed = await parseJsonBody(request, preferencesPatchBodySchema);
  if (!parsed.ok) return parsed.response;

  await updateUserPreferences(auth.userId, parsed.data);
  const prefs = await getUserPreferences(auth.userId);
  return NextResponse.json({
    batchWindows: prefs.batchWindows,
    focusModeEnabled: prefs.focusModeEnabled,
    autoResponderTemplate: prefs.autoResponderTemplate,
    followUpDaysDefault: prefs.followUpDaysDefault,
    timezone: prefs.timezone,
  });
}
