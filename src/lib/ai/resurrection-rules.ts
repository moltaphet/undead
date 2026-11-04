import type { Resurrection } from "../schemas";

const BANNED = /\b(leverag\w*|synerg\w*|revolutioni[sz]\w*|game[- ]?changers?|seamless(?:ly)?|unlock\w*)\b/gi;
const FINANCIAL =
  /\b(profits?|profitable|roi|return on investment|guaranteed? (?:returns?|income)|financial returns?|returns? (?:for|to) (?:backers|investors|supporters)|token price|price target|dividends?|passive income|yield|appreciate in value|\d+x (?:returns?|gains?))\b/gi;
const EMOJI = /\p{Extended_Pictographic}/gu;

export const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Every string in the plan, for whole-plan checks. */
function allText(r: Resurrection): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(r);
  return out;
}

/**
 * Deterministic tone and compliance checks run after zod. Prompt rules alone are not enough,
 * so any hit triggers the single corrective retry.
 */
export function checkResurrection(r: Resurrection, revivalScore: number): string[] {
  const problems: string[] = [];

  const days = r.sevenDayPlan.map((d) => d.day);
  if (days.join(",") !== "1,2,3,4,5,6,7") problems.push("sevenDayPlan days must be exactly 1,2,3,4,5,6,7 in order.");

  r.mvpCut.kill.forEach((k, i) => {
    if (!/\bbecause\b/i.test(k)) problems.push(`mvpCut.kill[${i}] must use the format "X — because Y".`);
  });

  const banned = new Set(allText(r).flatMap((t) => t.match(BANNED) ?? []).map((w) => w.toLowerCase()));
  if (banned.size) problems.push(`Banned words used: ${[...banned].join(", ")}. Rewrite those sentences plainly.`);

  const pitch = Object.values(r.crowdfundingPitch).flat().join(" ");
  const financial = new Set((pitch.match(FINANCIAL) ?? []).map((w) => w.toLowerCase()));
  if (financial.size) {
    problems.push(`The crowdfunding pitch makes financial claims (${[...financial].join(", ")}). Remove every mention of returns, profit or prices.`);
  }

  if ((r.launchPosts.x.match(EMOJI) ?? []).length > 1) problems.push("launchPosts.x may contain at most 1 emoji.");
  if ((r.launchPosts.x.match(/#\w/g) ?? []).length > 1) problems.push("launchPosts.x may contain at most 1 hashtag.");

  const story = wordCount(r.crowdfundingPitch.story);
  if (story < 90 || story > 225) problems.push(`crowdfundingPitch.story has ${story} words; write 120 to 180.`);
  const prompt = wordCount(r.aiBuildPrompt);
  if (prompt < 110 || prompt > 375) problems.push(`aiBuildPrompt has ${prompt} words; write 150 to 300.`);

  if (revivalScore < 25 && !r.honestNote?.trim()) {
    problems.push("honestNote is required because the revival score is under 25.");
  }
  return problems;
}
