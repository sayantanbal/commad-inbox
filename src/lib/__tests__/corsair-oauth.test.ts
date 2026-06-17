import { describe, expect, test } from "bun:test";
import { buildCorsairRedirectUri, OAUTH_STATE_COOKIE } from "@/lib/corsair/oauth-url";

describe("corsair oauth URLs", () => {
  test("redirect URI points at corsair callback", () => {
    const uri = buildCorsairRedirectUri("https://app.example.com");
    expect(uri).toBe("https://app.example.com/api/auth/callback/corsair");
  });

  test("strips trailing slash from app URL", () => {
    const uri = buildCorsairRedirectUri("https://app.example.com/");
    expect(uri).toBe("https://app.example.com/api/auth/callback/corsair");
  });

  test("oauth state cookie name is stable", () => {
    expect(OAUTH_STATE_COOKIE).toBe("oauth_state");
  });
});
