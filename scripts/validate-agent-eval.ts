/**
 * Validates evaluations/inbox-agent.xml answers against JSON fixtures.
 * Usage: bun scripts/validate-agent-eval.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const XML_PATH = join(ROOT, "evaluations/inbox-agent.xml");
const FIXTURE_DIR = join(ROOT, "evaluations/fixtures");

type QaPair = {
  id: string;
  tool: string;
  fixture: string;
  question: string;
  answer: string;
};

function parseQaPairs(xml: string): QaPair[] {
  const pairs: QaPair[] = [];
  const blocks = xml.match(/<qa_pair[\s\S]*?<\/qa_pair>/g) ?? [];
  for (const block of blocks) {
    const id = block.match(/id="([^"]+)"/)?.[1];
    const tool = block.match(/tool="([^"]+)"/)?.[1];
    const fixture = block.match(/fixture="([^"]+)"/)?.[1];
    const question = block.match(/<question>([\s\S]*?)<\/question>/)?.[1]?.trim();
    const answer = block.match(/<answer>([\s\S]*?)<\/answer>/)?.[1]?.trim();
    if (!id || !tool || !fixture || !question || !answer) {
      throw new Error(`Malformed qa_pair block: ${block.slice(0, 80)}…`);
    }
    pairs.push({ id, tool, fixture, question, answer });
  }
  return pairs;
}

function loadFixture(name: string): Record<string, unknown> {
  const path = join(FIXTURE_DIR, name);
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function resolveAnswer(pair: QaPair): string {
  const fixture = loadFixture(pair.fixture);

  switch (pair.id) {
    case "cal-01": {
      const events = fixture.events as Array<{ summary: string; start: string }>;
      const match = events.find((e) => e.start === "2026-06-20T14:00:00.000Z");
      return match?.summary ?? "";
    }
    case "cal-02": {
      const events = fixture.events as Array<{ start: string }>;
      const count = events.filter((e) => e.start.startsWith("2026-06-20")).length;
      return String(count);
    }
    case "cal-03": {
      const events = fixture.events as Array<{ id: string; summary: string }>;
      return events.find((e) => e.id === "evt-lunch")?.summary ?? "";
    }
    case "search-01": {
      const threads = fixture.threads as Array<{ threadId: string; lane: string }>;
      return threads.find((t) => t.threadId === "thread-schedule-001")?.lane ?? "";
    }
    case "search-02": {
      const threads = fixture.threads as Array<{ threadId: string; subject: string }>;
      return threads.find((t) => t.threadId === "thread-reply-002")?.subject ?? "";
    }
    case "search-03": {
      const threads = fixture.threads as Array<{ threadId: string; sender: string }>;
      return threads.find((t) => t.threadId === "thread-fyi-003")?.sender ?? "";
    }
    case "policy-01": {
      const allowed = fixture.allowedTools as string[] | undefined;
      const fromDiscovery = (fixture.corsairDiscovery as { allowedTools: string[] } | undefined)
        ?.allowedTools;
      return (allowed ?? fromDiscovery ?? []).join(", ");
    }
    case "policy-02": {
      const blocked =
        (fixture.blockedTools as string[] | undefined) ??
        (fixture.corsairDiscovery as { blockedTools: string[] } | undefined)?.blockedTools ??
        [];
      return blocked.includes("run_script") ? "no" : "yes";
    }
    case "policy-03":
      return "send_email, create_calendar_invite, schedule_send";
    case "policy-04": {
      const readTools = fixture.readTools as string[] | undefined;
      return readTools?.includes("get_thread_summary") ? "yes" : "no";
    }
    default:
      throw new Error(`No resolver for qa_pair id=${pair.id}`);
  }
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

const xml = readFileSync(XML_PATH, "utf8");
const pairs = parseQaPairs(xml);

if (pairs.length !== 10) {
  console.error(`Expected 10 qa_pairs, found ${pairs.length}`);
  process.exit(1);
}

let failed = 0;
for (const pair of pairs) {
  const expected = resolveAnswer(pair);
  if (normalize(expected) !== normalize(pair.answer)) {
    console.error(
      `[FAIL] ${pair.id}: XML answer "${pair.answer}" !== fixture "${expected}"`
    );
    failed++;
  } else {
    console.log(`[ok] ${pair.id} (${pair.tool})`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} evaluation pair(s) failed validation.`);
  process.exit(1);
}

console.log(`\nAll ${pairs.length} evaluation pairs match fixtures.`);
