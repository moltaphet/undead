import { ApiError, FinishReason } from "@google/genai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { generateJson } from "../ai/generate";
import { createSeanceStream, REFUSAL_LINE } from "../seance/stream";
import { getProvider } from ".";
import { geminiProvider, resetGeminiBreaker, toGeminiError } from "./gemini";

const generateContent = vi.fn();
const generateContentStream = vi.fn();

vi.mock("@google/genai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@google/genai")>();
  class GoogleGenAI {
    models = { generateContent, generateContentStream };
  }
  return { ...actual, GoogleGenAI };
});

const usageMetadata = { promptTokenCount: 1_000, cachedContentTokenCount: 200, candidatesTokenCount: 300, thoughtsTokenCount: 100 };

const reply = (text: string, finishReason: string = FinishReason.STOP) => ({
  text,
  candidates: [{ finishReason }],
  usageMetadata,
});

async function* chunksOf(...chunks: Array<{ text?: string; finishReason?: string; blockReason?: string; usageMetadata?: object }>) {
  for (const c of chunks) {
    yield {
      text: c.text,
      candidates: c.finishReason ? [{ finishReason: c.finishReason }] : [],
      promptFeedback: c.blockReason ? { blockReason: c.blockReason } : undefined,
      usageMetadata: c.usageMetadata,
    };
  }
}

const readAll = (stream: ReadableStream<Uint8Array>) => new Response(stream).text();

beforeEach(() => {
  generateContent.mockReset();
  generateContentStream.mockReset();
  vi.stubEnv("LLM_PROVIDER", "gemini");
  vi.stubEnv("GEMINI_API_KEY", "test-key-not-real");
  vi.stubEnv("GEMINI_MODEL", "");
  vi.stubEnv("GEMINI_FALLBACK_MODEL", "");
  resetGeminiBreaker();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("getProvider", () => {
  it("honours LLM_PROVIDER", () => {
    vi.stubEnv("LLM_PROVIDER", "anthropic");
    expect(getProvider().name).toBe("anthropic");
    vi.stubEnv("LLM_PROVIDER", "Gemini");
    expect(getProvider().name).toBe("gemini");
  });

  it("defaults to Gemini, and to Claude only when just an Anthropic key exists", () => {
    vi.stubEnv("LLM_PROVIDER", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(getProvider().name).toBe("gemini");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key-not-real");
    expect(getProvider().name).toBe("anthropic");
    vi.stubEnv("GEMINI_API_KEY", "test-key-not-real");
    expect(getProvider().name).toBe("gemini");
  });

  it("rejects an unknown provider name", () => {
    vi.stubEnv("LLM_PROVIDER", "gpt");
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => getProvider()).toThrowError(expect.objectContaining({ code: "AI_CONFIG" }));
  });
});

describe("gemini completeJson", () => {
  const req = { system: "sys", user: "usr", maxTokens: 4_096, effort: "medium" as const };

  it("asks for JSON with a thinking budget on top of the output limit", async () => {
    generateContent.mockResolvedValueOnce(reply('{"n":1}'));
    await geminiProvider.completeJson(req);
    expect(generateContent).toHaveBeenCalledWith({
      model: "gemini-3.5-flash",
      contents: "usr",
      config: {
        httpOptions: { timeout: 45_000, retryOptions: { attempts: 1 } },
        systemInstruction: "sys",
        maxOutputTokens: 4_096 + 1_024,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 1_024 },
      },
    });
  });

  it("uses GEMINI_MODEL when set", async () => {
    vi.stubEnv("GEMINI_MODEL", "gemini-custom");
    generateContent.mockResolvedValueOnce(reply("{}"));
    await geminiProvider.completeJson(req);
    expect(generateContent.mock.calls[0][0].model).toBe("gemini-custom");
    expect(geminiProvider.model).toBe("gemini-custom");
  });

  it("maps text, usage (cached split out, thinking billed as output) and stop reasons", async () => {
    generateContent.mockResolvedValueOnce(reply('{"n":1}'));
    await expect(geminiProvider.completeJson(req)).resolves.toEqual({
      text: '{"n":1}',
      stopReason: "end",
      model: "gemini-3.5-flash",
      usage: { input_tokens: 800, output_tokens: 400, cache_read_input_tokens: 200, cache_creation_input_tokens: 0 },
    });
    generateContent.mockResolvedValueOnce(reply("{", FinishReason.MAX_TOKENS));
    expect((await geminiProvider.completeJson(req)).stopReason).toBe("max_tokens");
    generateContent.mockResolvedValueOnce(reply("", FinishReason.SAFETY));
    expect((await geminiProvider.completeJson(req)).stopReason).toBe("refusal");
    generateContent.mockResolvedValueOnce({ text: undefined, promptFeedback: { blockReason: "PROHIBITED_CONTENT" } });
    expect(await geminiProvider.completeJson(req)).toMatchObject({ text: "", stopReason: "refusal", usage: null });
  });

  it("raises a typed config error when GEMINI_API_KEY is missing", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.resetModules();
    const fresh = await import("./gemini");
    await expect(fresh.geminiProvider.completeJson(req)).rejects.toMatchObject({ code: "AI_CONFIG" });
    expect(generateContent).not.toHaveBeenCalled();
  });
});

describe("toGeminiError", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("treats quota and overload as busy", () => {
    expect(toGeminiError(new ApiError({ message: "quota", status: 429 })).code).toBe("AI_BUSY");
    expect(toGeminiError(new ApiError({ message: "overloaded", status: 503 })).code).toBe("AI_BUSY");
    expect(toGeminiError(new TypeError("fetch failed")).code).toBe("AI_BUSY");
  });

  it("treats a bad key or model as a configuration problem", () => {
    expect(toGeminiError(new ApiError({ message: "API key not valid", status: 400 })).code).toBe("AI_CONFIG");
    expect(toGeminiError(new ApiError({ message: "model not found", status: 404 })).code).toBe("AI_CONFIG");
    expect(toGeminiError(new ApiError({ message: "denied", status: 403 })).code).toBe("AI_CONFIG");
  });

  it("never leaks provider detail into the user-facing message", () => {
    expect(toGeminiError(new ApiError({ message: "key AIza-secret invalid", status: 400 })).message).not.toContain("AIza");
  });
});

describe("generateJson through Gemini", () => {
  const opts = { label: "test", system: "s", user: "u", schema: z.object({ n: z.number().int() }), maxTokens: 100, effort: "low" as const };

  it("parses, retries once with the problems, and logs usage with the provider name", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    generateContent.mockResolvedValueOnce(reply('{"n":"x"}')).mockResolvedValueOnce(reply('{"n":3}'));
    await expect(generateJson(opts)).resolves.toEqual({ n: 3 });
    expect(generateContent.mock.calls[1][0].contents).toContain('{"n":"x"}');
    expect(info.mock.calls.map((c) => c[0])).toEqual([
      "[usage] test gemini in=800 out=400 cache_read=200 cache_write=0 est=$0.0048 model=gemini-3.5-flash",
      "[usage] test#retry gemini in=800 out=400 cache_read=200 cache_write=0 est=$0.0048 model=gemini-3.5-flash",
    ]);
  });
});

describe("gemini séance stream", () => {
  const signal = () => new AbortController().signal;

  it("streams text, maps roles, and logs usage at the end", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    generateContentStream.mockResolvedValueOnce(
      chunksOf({ text: "Hello " }, { text: "there.", finishReason: FinishReason.STOP, usageMetadata }),
    );
    const out = await readAll(
      await createSeanceStream("sys", [{ role: "assistant", content: "boo" }, { role: "user", content: "hi" }], signal()),
    );
    expect(out).toBe("Hello there.");
    const params = generateContentStream.mock.calls[0][0];
    expect(params.config.systemInstruction).toBe("sys");
    expect(params.config.thinkingConfig).toEqual({ thinkingBudget: 0 });
    expect(params.contents.map((c: { role: string }) => c.role)).toEqual(["user", "model", "user"]);
    expect(info).toHaveBeenCalledWith(expect.stringMatching(/^\[usage\] seance history=2 gemini in=800 out=400/));
  });

  it("answers in character when the model blocks the reply", async () => {
    generateContentStream.mockResolvedValueOnce(chunksOf({ blockReason: "SAFETY" }));
    expect(await readAll(await createSeanceStream("sys", [], signal()))).toBe(REFUSAL_LINE);
  });

  it("throws a typed busy error when the stream fails before any text", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    generateContentStream.mockRejectedValue(new ApiError({ message: "quota", status: 429 }));
    await expect(createSeanceStream("sys", [], signal())).rejects.toMatchObject({ code: "AI_BUSY" });
  });

  it("aborts the request when the client goes away", async () => {
    let upstream: AbortSignal | undefined;
    generateContentStream.mockImplementationOnce(async (p: { config: { abortSignal: AbortSignal } }) => {
      upstream = p.config.abortSignal;
      return chunksOf({ text: "a" }, { text: "b" });
    });
    const ctrl = new AbortController();
    const stream = await createSeanceStream("sys", [], ctrl.signal);
    await stream.cancel();
    expect(upstream?.aborted).toBe(true);
  });
});

describe("gemini model fallback", () => {
  const req = { system: "s", user: "u", maxTokens: 100, effort: "low" as const };
  const overloaded = () => new ApiError({ message: "high demand", status: 503 });

  beforeEach(() => vi.spyOn(console, "warn").mockImplementation(() => {}));

  it("retries on the fallback model when the main model is overloaded or rate limited", async () => {
    generateContent.mockRejectedValueOnce(overloaded()).mockResolvedValueOnce(reply("{}"));
    const res = await geminiProvider.completeJson(req);
    expect(generateContent.mock.calls.map((c) => c[0].model)).toEqual(["gemini-3.5-flash", "gemini-3-flash-preview"]);
    expect(res.model).toBe("gemini-3-flash-preview");
    resetGeminiBreaker();
    generateContent.mockRejectedValueOnce(new ApiError({ message: "quota", status: 429 })).mockResolvedValueOnce(reply("{}"));
    expect((await geminiProvider.completeJson(req)).model).toBe("gemini-3-flash-preview");
  });

  it("does not fall back on a configuration error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    generateContent.mockRejectedValueOnce(new ApiError({ message: "bad key", status: 403 }));
    await expect(geminiProvider.completeJson(req)).rejects.toMatchObject({ code: "AI_CONFIG" });
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it("can be turned off, and reports busy if the fallback is overloaded too", async () => {
    vi.stubEnv("GEMINI_FALLBACK_MODEL", "none");
    generateContent.mockRejectedValueOnce(overloaded());
    await expect(geminiProvider.completeJson(req)).rejects.toMatchObject({ code: "AI_BUSY" });
    expect(generateContent).toHaveBeenCalledTimes(1);
    vi.stubEnv("GEMINI_FALLBACK_MODEL", "");
    generateContent.mockReset();
    generateContent.mockRejectedValueOnce(overloaded()).mockRejectedValueOnce(overloaded());
    await expect(geminiProvider.completeJson(req)).rejects.toMatchObject({ code: "AI_BUSY" });
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("falls back for the séance stream before the first chunk", async () => {
    generateContentStream.mockRejectedValueOnce(overloaded()).mockResolvedValueOnce(chunksOf({ text: "boo", finishReason: FinishReason.STOP }));
    const out = await readAll(await createSeanceStream("sys", [], new AbortController().signal));
    expect(out).toBe("boo");
    expect(generateContentStream.mock.calls.map((c) => c[0].model)).toEqual(["gemini-3.5-flash", "gemini-3-flash-preview"]);
  });

  it("treats a main-model timeout as overload and then skips the main model for a minute", async () => {
    const timeout = Object.assign(new Error("timed out"), { name: "TimeoutError" });
    generateContent.mockRejectedValueOnce(timeout).mockResolvedValue(reply("{}"));
    await geminiProvider.completeJson(req);
    await geminiProvider.completeJson(req);
    expect(generateContent.mock.calls.map((c) => c[0].model)).toEqual([
      "gemini-3.5-flash",
      "gemini-3-flash-preview",
      "gemini-3-flash-preview",
    ]);
    expect(generateContent.mock.calls[0][0].config.httpOptions).toEqual({ timeout: 45_000, retryOptions: { attempts: 1 } });
    expect(generateContent.mock.calls[1][0].config.httpOptions).toBeUndefined();
  });

  it("does not blame the model when the séance client disconnects", async () => {
    const ctrl = new AbortController();
    generateContentStream.mockImplementationOnce(async () => {
      ctrl.abort();
      throw Object.assign(new Error("aborted"), { name: "AbortError" });
    });
    await expect(createSeanceStream("sys", [], ctrl.signal)).rejects.toBeDefined();
    expect(generateContentStream).toHaveBeenCalledTimes(1);
  });
});
