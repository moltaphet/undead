import { afterEach, describe, expect, it, vi } from "vitest";
import { ghCommits, ghRepo } from "@/test/fixtures";
import { fetchRepoData, rateLimitMessage } from "./github";

type Handler = (path: string) => Response | undefined;

function mockFetch(handler: Handler) {
  vi.stubGlobal("fetch", async (input: string) => {
    const path = new URL(input).pathname + new URL(input).search;
    return handler(path) ?? new Response("{}", { status: 404 });
  });
}

const json = (body: unknown, init?: ResponseInit) => Response.json(body, init);

const base: Handler = (p) => {
  if (p === "/repos/o/r") return json(ghRepo());
  if (p.startsWith("/repos/o/r/commits")) return json(ghCommits(3));
  return undefined;
};

afterEach(() => vi.unstubAllGlobals());

const ref = { owner: "o", repo: "r" };

describe("fetchRepoData", () => {
  it("returns missing sections for 404s", async () => {
    mockFetch(base);
    const data = await fetchRepoData(ref);
    expect(data.readme.kind).toBe("missing");
    expect(data.commits.kind).toBe("ok");
  });

  it("maps a missing repo to NOT_FOUND_OR_PRIVATE", async () => {
    mockFetch(() => undefined);
    await expect(fetchRepoData(ref)).rejects.toMatchObject({ code: "NOT_FOUND_OR_PRIVATE", status: 404 });
  });

  it("refuses private repos even when the token can see them", async () => {
    mockFetch((p) => (p === "/repos/o/r" ? json(ghRepo({ private: true })) : base(p)));
    await expect(fetchRepoData(ref)).rejects.toMatchObject({ code: "NOT_FOUND_OR_PRIVATE" });
  });

  it("fails the whole request on a rate limit in any section", async () => {
    const reset = String(Math.floor(Date.now() / 1000) + 600);
    mockFetch((p) =>
      p.startsWith("/repos/o/r/languages")
        ? json({}, { status: 403, headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": reset } })
        : base(p),
    );
    await expect(fetchRepoData(ref)).rejects.toMatchObject({ code: "RATE_LIMITED", status: 429 });
  });

  it("degrades other section failures instead of failing", async () => {
    mockFetch((p) => (p.startsWith("/repos/o/r/issues") ? json({}, { status: 500 }) : base(p)));
    const data = await fetchRepoData(ref);
    expect(data.issues).toMatchObject({ kind: "failed", error: { code: "GITHUB_UNAVAILABLE" } });
  });

  it("maps timeouts on the repo itself to TIMEOUT", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new DOMException("timed out", "TimeoutError");
    });
    await expect(fetchRepoData(ref)).rejects.toMatchObject({ code: "TIMEOUT", status: 504 });
  });

  it("treats an empty repo (409 on commits) as missing commits", async () => {
    mockFetch((p) => (p.startsWith("/repos/o/r/commits") ? json({}, { status: 409 }) : base(p)));
    expect((await fetchRepoData(ref)).commits.kind).toBe("missing");
  });
});

describe("rateLimitMessage", () => {
  it("says when to retry", () => {
    const now = Date.UTC(2026, 10, 4, 12, 0);
    expect(rateLimitMessage(now / 1000 + 600, now)).toBe(
      "GitHub is rate-limiting us. Try again after 12:10 UTC (about 10 min).",
    );
  });
});
