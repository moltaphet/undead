import { describe, expect, it } from "vitest";
import { resurrectionFixture } from "@/test/resurrection-fixture";
import { resurrectionSchema } from "../schemas";
import { checkResurrection, wordCount } from "./resurrection-rules";

describe("resurrection schema", () => {
  it("accepts the fixture", () => {
    expect(resurrectionSchema.safeParse(resurrectionFixture()).success).toBe(true);
  });

  it("requires exactly 7 nights and exactly 3 bullets", () => {
    const f = resurrectionFixture();
    expect(resurrectionSchema.safeParse({ ...f, sevenDayPlan: f.sevenDayPlan.slice(0, 6) }).success).toBe(false);
    expect(resurrectionSchema.safeParse({ ...f, landingCopy: { ...f.landingCopy, bullets: ["a", "b"] } }).success).toBe(false);
    expect(resurrectionSchema.safeParse({ ...f, launchPosts: { ...f.launchPosts, x: "x".repeat(261) } }).success).toBe(false);
  });
});

describe("checkResurrection", () => {
  it("passes a clean plan", () => {
    expect(checkResurrection(resurrectionFixture(), 50)).toEqual([]);
  });

  it("flags banned words anywhere", () => {
    const f = resurrectionFixture();
    f.landingCopy.subheadline = "Leverage AI to unlock a seamless, game-changer workflow";
    const [problem] = checkResurrection(f, 50);
    expect(problem).toMatch(/leverage/);
    expect(problem).toMatch(/unlock/);
    expect(problem).toMatch(/seamless/);
    expect(problem).toMatch(/game-changer/);
  });

  it("flags financial claims in the pitch", () => {
    const f = resurrectionFixture();
    f.crowdfundingPitch.backerReward = "Early backers share in the profits and a guaranteed return.";
    expect(checkResurrection(f, 50).join(" ")).toMatch(/financial claims \(profits, guaranteed return\)/);
  });

  it("enforces kill format, emoji/hashtag limits, day order and word counts", () => {
    const f = resurrectionFixture();
    f.mvpCut.kill[0] = "The plugin system";
    f.launchPosts.x = "It's back 🪦🔥 #buildinpublic #indiehackers";
    f.sevenDayPlan[0].day = 2;
    f.crowdfundingPitch.story = "Too short.";
    const problems = checkResurrection(f, 50).join(" | ");
    expect(problems).toMatch(/kill\[0\]/);
    expect(problems).toMatch(/at most 1 emoji/);
    expect(problems).toMatch(/at most 1 hashtag/);
    expect(problems).toMatch(/1,2,3,4,5,6,7/);
    expect(problems).toMatch(/story has 2 words/);
  });

  it("requires an honest note under a revival score of 25", () => {
    expect(checkResurrection(resurrectionFixture(), 20).join(" ")).toMatch(/honestNote is required/);
    expect(checkResurrection({ ...resurrectionFixture(), honestNote: "Pivot to the parser." }, 20)).toEqual([]);
  });

  it("counts words", () => {
    expect(wordCount("  one two\nthree  ")).toBe(3);
  });
});
