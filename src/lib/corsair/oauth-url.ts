export const OAUTH_STATE_COOKIE = "oauth_state";

export function buildCorsairRedirectUri(appUrl: string): string {
  const base = appUrl.replace(/\/$/, "");
  return `${base}/api/auth/callback/corsair`;
}
