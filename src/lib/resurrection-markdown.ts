import type { Resurrection } from "./schemas";

const bullets = (items: string[]) => items.map((i) => `- ${i}`).join("\n");

/** The whole plan as clean Markdown, for copy and download. */
export function resurrectionToMarkdown(fullName: string, r: Resurrection): string {
  const p = r.newPositioning;
  const sections = [
    `# Resurrection plan: ${fullName}`,
    r.honestNote ? `> ${r.honestNote}` : null,
    `## Positioning\n\n**${p.oneLiner}**\n\n- **Target user:** ${p.targetUser}\n- **Pain point:** ${p.painPoint}\n- **Why now:** ${p.whyNow}`,
    `## The cut\n\n### Keep\n${bullets(r.mvpCut.keep)}\n\n### Kill\n${bullets(r.mvpCut.kill)}\n\n### Build\n${bullets(r.mvpCut.build)}`,
    `## 7 nights\n\n${r.sevenDayPlan.map((d) => `### Night ${d.day}: ${d.title}\n${d.tasks.map((t) => `- [ ] ${t}`).join("\n")}`).join("\n\n")}`,
    `## Landing copy\n\n# ${r.landingCopy.headline}\n\n${r.landingCopy.subheadline}\n\n${bullets(r.landingCopy.bullets)}\n\n**[${r.landingCopy.cta}]**`,
    `## Launch\n\n### Post for X\n\n${r.launchPosts.x}\n\n### Where to find the first users\n${bullets(r.launchPosts.firstUsersWhere)}`,
    `## Crowdfunding pitch (draft for Vibestarter)\n\n### ${r.crowdfundingPitch.title}\n\n${r.crowdfundingPitch.story}\n\n**What the funding is for**\n${bullets(r.crowdfundingPitch.fundingUse)}\n\n**Backer reward:** ${r.crowdfundingPitch.backerReward}`,
    `## Rebuild prompt\n\n\`\`\`\n${r.aiBuildPrompt}\n\`\`\``,
  ];
  return `${sections.filter(Boolean).join("\n\n")}\n`;
}
