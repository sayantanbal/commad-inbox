#!/usr/bin/env bun
/**
 * Automated pre-submission checks (repo-local).
 * Manual items (video URL, social posts, prod deploy) stay in docs/submission.md.
 */
import { spawnSync } from "node:child_process";

function run(command: string): void {
  const result = spawnSync(command, {
    shell: true,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command}`);
  }
}

const steps = [
  { name: "unit tests", command: "bun test src/lib/__tests__" },
  { name: "agent eval fixtures", command: "bun scripts/validate-agent-eval.ts" },
  {
    name: "production build",
    command: "bun run build",
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://ci:ci@localhost:5432/ci",
      CORSAIR_KEK: process.env.CORSAIR_KEK ?? "dGVzdC1rZWstdmFsdWUtZm9yLWNpLW9ubHk=",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "ci-client-id.apps.googleusercontent.com",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "ci-client-secret",
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "dGVzdC1hdXRoLXNlY3JldC1mb3ItY2k=",
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
      APP_URL: process.env.APP_URL ?? "http://localhost:3000",
    },
  },
] as const;

console.log("Command Inbox — submission smoke\n");

let failed = 0;
for (const step of steps) {
  process.stdout.write(`• ${step.name}… `);
  try {
    const result = spawnSync(step.command, {
      shell: true,
      stdio: "pipe",
      env: { ...process.env, ...("env" in step ? step.env : {}) },
    });
    if (result.status !== 0) {
      failed++;
      console.log("FAIL");
      if (result.stderr?.length) process.stderr.write(result.stderr);
      if (result.stdout?.length) process.stdout.write(result.stdout);
      continue;
    }
    console.log("ok");
  } catch (error) {
    failed++;
    console.log("FAIL");
    console.error(error);
  }
}

console.log("\nManual before submit (see docs/submission.md):");
console.log("  - Live URL returns 200");
console.log("  - Demo video URL in README");
console.log("  - X + LinkedIn post URLs in submission.md");
console.log("  - Judge Gmail addresses in OAuth test users");

if (failed > 0) {
  process.exit(1);
}

console.log("\nAutomated smoke passed.");
