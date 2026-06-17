import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "bun run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      E2E_TEST: "1",
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://ci:ci@localhost:5432/ci",
      CORSAIR_KEK: process.env.CORSAIR_KEK ?? "dGVzdC1rZWstdmFsdWUtZm9yLWNpLW9ubHk=",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "ci-client-id.apps.googleusercontent.com",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "ci-client-secret",
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "dGVzdC1hdXRoLXNlY3JldC1mb3ItY2k=",
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://127.0.0.1:3000",
      APP_URL: process.env.APP_URL ?? "http://127.0.0.1:3000",
    },
  },
});
