import "server-only";

import { getUserPreferences } from "@/lib/focus/window";

export async function isOnboardingComplete(userId: string): Promise<boolean> {
  const prefs = await getUserPreferences(userId);
  return prefs.onboardingCompletedAt != null;
}

export async function getOnboardingRedirectPath(userId: string): Promise<string> {
  const prefs = await getUserPreferences(userId);
  if (prefs.onboardingCompletedAt) return "/inbox";
  if (prefs.workingDaysStructured) return "/onboarding/contacts";
  return "/onboarding/working-days";
}
