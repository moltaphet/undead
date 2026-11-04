import { describe, expect, it } from "vitest";
import { cleanReadme, truncateOnParagraph } from "./readme";

describe("cleanReadme", () => {
  it("strips badges, images, HTML and collapses whitespace", () => {
    const input = [
      "<p align=\"center\"><img src=\"logo.png\"></p>",
      "[![Build](https://ci/badge.svg)](https://ci)  ![shot](a.png)",
      "# Title   here",
      "",
      "",
      "",
      "Some &amp; text <b>bold</b>.",
      "<!-- hidden -->",
      "[logo]: https://x/y.png",
    ].join("\n");
    expect(cleanReadme(input)).toBe("# Title here\n\nSome & text bold.");
  });
});

describe("truncateOnParagraph", () => {
  it("leaves short text alone", () => {
    expect(truncateOnParagraph("short", 100)).toEqual({ text: "short", truncated: false });
  });

  it("cuts on a paragraph boundary when possible", () => {
    const text = `${"a".repeat(70)}\n\n${"b".repeat(70)}`;
    const out = truncateOnParagraph(text, 100);
    expect(out).toEqual({ text: `${"a".repeat(70)}…`, truncated: true });
  });

  it("never exceeds the limit", () => {
    const out = truncateOnParagraph("word ".repeat(5000), 6000);
    expect(out.text.length).toBeLessThanOrEqual(6000);
  });
});
