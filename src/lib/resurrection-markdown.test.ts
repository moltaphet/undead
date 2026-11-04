import { describe, expect, it } from "vitest";
import { resurrectionFixture } from "@/test/resurrection-fixture";
import { resurrectionToMarkdown } from "./resurrection-markdown";

describe("resurrectionToMarkdown", () => {
  it("renders every section with nights as checklists", () => {
    const md = resurrectionToMarkdown("o/r", { ...resurrectionFixture(), honestNote: "Pivot." });
    expect(md.startsWith("# Resurrection plan: o/r\n\n> Pivot.")).toBe(true);
    for (const heading of ["## Positioning", "## The cut", "## 7 nights", "## Landing copy", "## Launch", "## Crowdfunding pitch", "## Rebuild prompt"]) {
      expect(md).toContain(heading);
    }
    expect(md).toContain("### Night 7: Night 7 title\n- [ ] Do a concrete thing");
    expect(md).toContain("- The GUI — because nobody asked for it");
  });

  it("omits the note when there is none", () => {
    expect(resurrectionToMarkdown("o/r", resurrectionFixture())).not.toContain(">");
  });
});
