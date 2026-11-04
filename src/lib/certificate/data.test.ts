import { describe, expect, it } from "vitest";
import { buildShareText, formatAge, sanitize, truncate, xIntentUrl } from "./data";

describe("formatAge", () => {
  it.each([
    ["2020-01-15", "2022-04-20", "2 years, 3 months"],
    ["2020-01-15", "2021-01-15", "1 year"],
    ["2020-01-31", "2020-03-01", "1 month"],
    ["2020-01-15", "2020-01-30", "Under a month"],
    ["2020-01-15", "2020-01-14", "Under a month"],
  ])("%s -> %s = %s", (a, b, expected) => expect(formatAge(a, b)).toBe(expected));
});

describe("sanitize/truncate", () => {
  it("drops glyphs the card fonts cannot draw", () => {
    expect(sanitize("fix 🐛 bug — 修复 “done”")).toBe("fix bug — “done”");
  });

  it("truncates on a word boundary with an ellipsis", () => {
    expect(truncate("the quick brown fox jumps", 15)).toBe("the quick…");
    expect(truncate("a".repeat(30), 10)).toBe(`${"a".repeat(9)}…`);
    expect(truncate("short", 10)).toBe("short");
  });
});

describe("buildShareText", () => {
  const url = "https://undead.example.com/r/some-owner/some-repo";

  it("fits a normal case", () => {
    const t = buildShareText("atom", "Killed by its own sibling", 31, url, "dead");
    expect(t).toBe(
      `My project atom has been declared dead. Cause of death: Killed by its own sibling 🪦 Revival odds: 31%. Get your autopsy: ${url}`,
    );
  });

  it("stays at or under 260 characters with long names, headlines and URLs", () => {
    const long = "x".repeat(100);
    for (const [name, headline, u] of [
      [long, long, url],
      ["r", "h".repeat(90), `${url}/${"p".repeat(150)}`],
      [long, long, `${url}/${"p".repeat(200)}`],
    ]) {
      const t = buildShareText(name, headline, 99, u, "dead");
      expect(t.length).toBeLessThanOrEqual(260);
    }
  });

  it("speaks differently about living repos", () => {
    expect(buildShareText("r", "h", 80, url, "alive")).toMatch(/came out breathing/);
  });

  it("builds an X intent URL", () => {
    expect(xIntentUrl("a b&c")).toBe("https://x.com/intent/post?text=a%20b%26c");
  });
});
