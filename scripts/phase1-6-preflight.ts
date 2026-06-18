#!/usr/bin/env bun
/**
 * Phase 1–6 preflight — local smoke + prod health probe.
 * See docs/phase1-6-ops-runbook.md
 */
import { spawnSync } from "node:child_process";

const PROD_URL = (process.env.PROD_SMOKE_URL ?? "https://command-inbox.sayantanbal.in").replace(
  /\/$/,
  ""
);

function run(command: string): boolean {
  const result = spawnSync(command, { shell: true, stdio: "inherit" });
  return result.status === 0;
}

console.log("Phase 1–6 preflight\n");

console.log("1. Local smoke:submission…");
if (!run("bun run smoke:submission")) {
  console.error("\nFix local smoke before deploy.");
  process.exit(1);
}

console.log("\n2. Prod health probe…");
try {
  const response = await fetch(`${PROD_URL}/api/health`);
  const body = (await response.json()) as {
    ok?: boolean;
    db?: string;
    integrations?: {
      pusher?: boolean;
      gmailPubSub?: boolean;
      gemini?: boolean;
      openai?: boolean;
    };
  };
  console.log(JSON.stringify(body, null, 2));

  if (!body.integrations) {
    console.warn("\n⚠ Prod missing integrations block — deploy latest main first.");
  } else {
    const { pusher, gmailPubSub, gemini, openai } = body.integrations;
    if (!pusher || !gmailPubSub || (!gemini && !openai)) {
      console.warn("\n⚠ Prod integrations incomplete — check Vercel env (Gemini, Pusher, Pub/Sub).");
    } else {
      console.log("\n✓ Prod integrations look configured.");
    }
  }
} catch (error) {
  console.error("Prod health fetch failed:", error);
}

console.log("\n3. Next: bun run smoke:prod (after deploy)");
console.log("   Full checklist: docs/phase1-6-ops-runbook.md");
