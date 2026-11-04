import Anthropic from "@anthropic-ai/sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { generateJson } from "./generate";

const create = vi.fn();

vi.mock("../anthropic", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../anthropic")>();
  return { ...actual, getAnthropic: () => ({ beta: { messages: { create } } }) };
});

const reply = (text: string, stop_reason = "end_turn") => ({
  content: [{ type: "thinking", thinking: "" }, { type: "text", text }],
  stop_reason,
});

const opts = {
  label: "test",
  system: "s",
  user: "u",
  schema: z.object({ n: z.number().int() }),
  maxTokens: 100,
  effort: "low" as const,
};

beforeEach(() => create.mockReset());

describe("generateJson", () => {
  it("returns valid output on the first try", async () => {
    create.mockResolvedValueOnce(reply('{"n": 3}'));
    await expect(generateJson(opts)).resolves.toEqual({ n: 3 });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("retries once with the validation problems, then succeeds", async () => {
    create.mockResolvedValueOnce(reply('{"n": "three"}')).mockResolvedValueOnce(reply('{"n": 3}'));
    await expect(generateJson(opts)).resolves.toEqual({ n: 3 });
    const retryUser = create.mock.calls[1][0].messages[0].content as string;
    expect(retryUser).toContain('{"n": "three"}');
    expect(retryUser).toMatch(/n: .*number/i);
  });

  it("fails with AI_BAD_OUTPUT after two bad answers", async () => {
    create.mockResolvedValue(reply("not json"));
    await expect(generateJson(opts)).rejects.toMatchObject({ code: "AI_BAD_OUTPUT", status: 502 });
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("treats truncation and refusal as bad output", async () => {
    create.mockResolvedValueOnce(reply('{"n": 1', "max_tokens")).mockResolvedValueOnce(reply("", "refusal"));
    await expect(generateJson(opts)).rejects.toMatchObject({ code: "AI_BAD_OUTPUT" });
  });

  it("applies extra checks", async () => {
    create.mockResolvedValue(reply('{"n": 13}'));
    const check = (d: { n: number }) => (d.n === 13 ? ["unlucky"] : []);
    await expect(generateJson({ ...opts, check })).rejects.toMatchObject({ code: "AI_BAD_OUTPUT" });
  });

  it("maps SDK errors", async () => {
    const headers = new Headers();
    create.mockRejectedValueOnce(new Anthropic.RateLimitError(429, {}, "slow down", headers));
    await expect(generateJson(opts)).rejects.toMatchObject({ code: "AI_BUSY", status: 503 });
    create.mockRejectedValueOnce(new Anthropic.AuthenticationError(401, {}, "bad key", headers));
    await expect(generateJson(opts)).rejects.toMatchObject({ code: "AI_CONFIG", status: 500 });
    create.mockRejectedValueOnce(new Anthropic.InternalServerError(529, {}, "overloaded", headers));
    await expect(generateJson(opts)).rejects.toMatchObject({ code: "AI_BUSY" });
  });
});
