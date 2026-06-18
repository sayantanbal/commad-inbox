#!/usr/bin/env bun
/**
 * Post-deploy smoke against production (or APP_URL).
 * Complements docs/deploy.md §6 — automated checks only; OAuth/M/agent still manual.
 */
const baseUrl = (
  process.env.PROD_SMOKE_URL ?? "https://command-inbox.sayantanbal.in"
).replace(/\/$/, "");

type Step = { name: string; run: () => Promise<void> };

async function fetchOk(path: string, expectStatus = 200): Promise<Response> {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, { redirect: "follow" });
  if (response.status !== expectStatus) {
    throw new Error(`${path} returned ${response.status}, expected ${expectStatus}`);
  }
  return response;
}

const steps: Step[] = [
  {
    name: "sign-in page",
    run: async () => {
      await fetchOk("/sign-in");
    },
  },
  {
    name: "health + DB",
    run: async () => {
      const response = await fetchOk("/api/health");
      const body = (await response.json()) as { ok?: boolean; db?: string };
      if (body.db !== "up") {
        throw new Error(`health db=${body.db ?? "unknown"}`);
      }
    },
  },
  {
    name: "Pusher env on server",
    run: async () => {
      const response = await fetchOk("/api/health");
      const body = (await response.json()) as {
        integrations?: { pusher?: boolean };
      };
      if (!body.integrations?.pusher) {
        throw new Error("Pusher not configured on server (check PUSHER_* env)");
      }
    },
  },
  {
    name: "Gmail Pub/Sub topic env",
    run: async () => {
      const response = await fetchOk("/api/health");
      const body = (await response.json()) as {
        integrations?: { gmailPubSub?: boolean };
      };
      if (!body.integrations?.gmailPubSub) {
        throw new Error("GMAIL_PUBSUB_TOPIC not set on server");
      }
    },
  },
  {
    name: "platform AI key (OpenAI or Gemini)",
    run: async () => {
      const response = await fetchOk("/api/health");
      const body = (await response.json()) as {
        integrations?: { openai?: boolean; gemini?: boolean };
      };
      if (!body.integrations?.openai && !body.integrations?.gemini) {
        throw new Error("No platform OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY on server");
      }
    },
  },
  {
    name: "evaluator docs reachable",
    run: async () => {
      await fetchOk("https://docs.command-inbox.sayantanbal.in/docs/overview/evaluator-guide");
    },
  },
];

console.log(`Command Inbox — prod smoke (${baseUrl})\n`);

let failed = 0;
for (let i = 0; i < steps.length; i++) {
  const step = steps[i]!;
  process.stdout.write(`${i + 1}. ${step.name}… `);
  try {
    await step.run();
    console.log("ok");
  } catch (error) {
    failed++;
    console.log("FAIL");
    console.error(`   ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log("\nManual prod checks (docs/deploy.md §6):");
console.log("  - Google OAuth sign-in + Gmail/Calendar connect");
console.log("  - Threads load on /inbox");
console.log("  - Webhook classifies inbound mail within ~30s");
console.log("  - / semantic search after index complete");
console.log("  - Mod+Shift+F advanced search");
console.log("  - Agent approve-and-send (rehearse twice before record)");

if (failed > 0) {
  process.exit(1);
}

console.log("\nAutomated prod smoke passed.");
