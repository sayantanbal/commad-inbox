import { describe, expect, it } from "bun:test";
import {
  filterPaletteNavCommands,
  searchThreadsForPalette,
} from "@/lib/inbox/palette-search";
import type { Thread } from "@/lib/types";

const threads: Thread[] = [
  {
    id: "1",
    subject: "Q2 budget review",
    snippet: "Can we meet Tuesday?",
    timestamp: new Date(),
    unread: true,
    participants: [{ email: "alice@acme.com", name: "Alice" }],
    labels: [],
    messages: [],
  },
  {
    id: "2",
    subject: "Lunch next week",
    snippet: "Sounds good",
    timestamp: new Date(),
    unread: false,
    participants: [{ email: "bob@startup.io", name: "Bob" }],
    labels: [],
    messages: [],
  },
];

describe("palette-search", () => {
  it("filters navigation commands by fuzzy keywords", () => {
    const results = filterPaletteNavCommands("archive done");
    expect(results.some((item) => item.action === "navArchive")).toBe(true);
  });

  it("matches threads by subject and sender", () => {
    const bySubject = searchThreadsForPalette(threads, "budget");
    expect(bySubject.map((t) => t.id)).toEqual(["1"]);

    const bySender = searchThreadsForPalette(threads, "bob");
    expect(bySender.map((t) => t.id)).toEqual(["2"]);
  });

  it("returns empty thread matches for blank query", () => {
    expect(searchThreadsForPalette(threads, "")).toEqual([]);
  });
});
