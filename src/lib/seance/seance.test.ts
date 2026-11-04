import Anthropic from "@anthropic-ai/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { modelAutopsy } from "@/test/autopsy-fixture";
import { ghCommits, ghRepo } from "@/test/fixtures";
import { buildDossier } from "../dossier";
import { buildSeancePrompt } from "../prompts/seance";
import { seanceRequestSchema } from "../schemas";
import { inferArchetype } from "./archetype";
import { createSeanceStream, FADING_LINE, REFUSAL_LINE } from "./stream";

let fake: ReturnType<typeof fakeStream>;
const streamFn = vi.fn(() => fake);

vi.mock("../anthropic", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../anthropic")>();
  return { ...actual, getAnthropic: () => ({ messages: { stream: streamFn } }) };
});

type Step = string | Error;

function fakeStream(steps: Step[], stopReason = "end_turn") {
  const abort = vi.fn();
  return {
    abort,
    finalMessage: async () => ({ stop_reason: stopReason }),
    async *[Symbol.asyncIterator]() {
      yield { type: "message_start" };
      for (const s of steps) {
        if (s instanceof Error) throw s;
        yield { type: "content_block_delta", delta: { type: "text_delta", text: s } };
      }
    },
  };
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
  return new Response(stream).text();
}

const NOW = new Date("2026-11-04T00:00:00Z");
function dossierWith(over: Parameters<typeof ghRepo>[0] = {}, readme = "A small tool.") {
  return buildDossier(
    {
      repo: ghRepo(over),
      readme: { kind: "ok", value: readme },
      commits: { kind: "ok", value: ghCommits(3, "add dark mode toggle") },
      languages: { kind: "missing" },
      tree: { kind: "missing" },
      packageJson: { kind: "missing" },
      issues: { kind: "missing" },
    },
    NOW,
  ).dossier;
}

beforeEach(() => {
  streamFn.mockClear();
  vi.stubEnv("LLM_PROVIDER", "anthropic");
});

afterEach(() => vi.unstubAllEnvs());

describe("seance request schema", () => {
  const base = { owner: "o", repo: "r" };
  const msg = (role: "user" | "assistant", content = "hi") => ({ role, content });

  it("accepts the opening request and a proper conversation", () => {
    expect(seanceRequestSchema.safeParse({ ...base, messages: [] }).success).toBe(true);
    expect(seanceRequestSchema.safeParse({ ...base, messages: [msg("assistant"), msg("user")] }).success).toBe(true);
  });

  it.each([
    ["starts with the user", [msg("user")]],
    ["ends with the ghost", [msg("assistant"), msg("user"), msg("assistant")]],
    ["does not alternate", [msg("assistant"), msg("user"), msg("user")]],
    ["user message too long", [msg("assistant"), msg("user", "x".repeat(1001))]],
    ["ghost message too long", [msg("assistant", "x".repeat(3001)), msg("user")]],
    ["too many messages", Array.from({ length: 21 }, (_, i) => msg(i % 2 ? "user" : "assistant"))],
    ["empty content", [msg("assistant", ""), msg("user")]],
  ])("rejects: %s", (_n, messages) => {
    expect(seanceRequestSchema.safeParse({ ...base, messages }).success).toBe(false);
  });
});

describe("inferArchetype", () => {
  it.each([
    [{ topics: ["cli", "terminal"] }, "Usage: run it in your terminal", "cli"],
    [{ topics: ["game"], description: "A roguelike in the browser" }, "Play the game", "game"],
    [{ topics: ["saas"], description: "Analytics dashboard for shops" }, "Sign up for a subscription", "saas"],
    [{ topics: [], description: "A tiny library for dates" }, "Install the library", "library"],
    [{ topics: [], description: null }, "Hello.", "mixed"],
  ] as const)("%o -> %s", (over, readme, expected) => {
    expect(inferArchetype(dossierWith({ ...over, topics: [...over.topics] }, readme))).toBe(expected);
  });
});

describe("buildSeancePrompt", () => {
  it("grounds the ghost in real data and picks the resurrection stance by score", () => {
    const d = dossierWith({ topics: ["cli"] }, "A CLI.");
    const high = buildSeancePrompt(d, { ...modelAutopsy({ revivalScore: 70 }), lastWords: "add dark mode toggle" });
    expect(high).toContain('You are the ghost of "r"');
    expect(high).toContain("command-line tool");
    expect(high).toContain("add dark mode toggle");
    expect(high).toMatch(/argue for it/);
    const low = buildSeancePrompt(d, { ...modelAutopsy({ revivalScore: 20 }), lastWords: null });
    expect(low).toMatch(/should not come back as you were/);
    expect(low).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z.*fetched/);
  });
});

describe("createSeanceStream", () => {
  it("streams text and uses thinking-off, low effort, cached system prompt", async () => {
    fake = fakeStream(["I was ", "a CLI."]);
    const out = await readAll(await createSeanceStream("sys", [], new AbortController().signal));
    expect(out).toBe("I was a CLI.");
    const params = (streamFn.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(params.thinking).toEqual({ type: "between_tools" });
    expect(params.output_config).toEqual({ effort: "low" });
    expect((params.messages as { content: string }[])[0].content).toMatch(/séance begins/);
  });

  it("throws a typed error if the stream fails before any text", async () => {
    fake = fakeStream([new Anthropic.RateLimitError(429, {}, "slow", new Headers())]);
    await expect(createSeanceStream("sys", [], new AbortController().signal)).rejects.toMatchObject({ code: "AI_BUSY" });
  });

  it("ends with the in-character line when the stream fails mid-reply", async () => {
    fake = fakeStream(["Half a thought", new Error("socket hang up")]);
    const out = await readAll(await createSeanceStream("sys", [], new AbortController().signal));
    expect(out).toBe(`Half a thought\n\n${FADING_LINE}`);
  });

  it("answers in character when the model declines without text", async () => {
    fake = fakeStream([], "refusal");
    expect(await readAll(await createSeanceStream("sys", [], new AbortController().signal))).toBe(REFUSAL_LINE);
  });

  it("aborts the upstream stream when the client goes away", async () => {
    fake = fakeStream(["one", "two"]);
    const ctrl = new AbortController();
    const stream = await createSeanceStream("sys", [], ctrl.signal);
    ctrl.abort();
    expect(fake.abort).toHaveBeenCalled();
    await stream.cancel();
  });
});
