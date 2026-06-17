export const ONBOARDING_CONTACTS_STATUSES = [
  "skipped",
  "imported",
  "gmail",
  "google",
  "demo",
] as const;

export type OnboardingContactsStatus = (typeof ONBOARDING_CONTACTS_STATUSES)[number];

export function parseOnboardingContactsStatus(
  value?: string | null
): OnboardingContactsStatus {
  if (
    value &&
    ONBOARDING_CONTACTS_STATUSES.includes(value as OnboardingContactsStatus)
  ) {
    return value as OnboardingContactsStatus;
  }
  return "skipped";
}
