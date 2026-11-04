import type { Resurrection } from "@/lib/schemas";

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");

export function resurrectionFixture(): Resurrection {
  return {
    honestNote: null,
    newPositioning: {
      oneLiner: "Icon stamps for indie app builders, in one command",
      targetUser: "Solo iOS developers shipping TestFlight builds weekly",
      painPoint: "They can't tell beta builds apart on their home screen.",
      whyNow: "AI tools make a one-week rebuild realistic.",
    },
    mvpCut: {
      keep: ["The stamping core", "The CLI flags"],
      kill: ["The GUI — because nobody asked for it", "Plugin support — because it never shipped"],
      build: ["A GitHub Action"],
    },
    sevenDayPlan: Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      title: `Night ${i + 1} title`,
      tasks: ["Do a concrete thing", "Ship it to a public URL"],
    })),
    landingCopy: { headline: "Know which build you're holding", subheadline: "Stamp every beta icon.", bullets: ["One", "Two", "Three"], cta: "Stamp my icons" },
    launchPosts: { x: "I brought my dead side project back 🪦 #buildinpublic", firstUsersWhere: ["r/iOSProgramming", "Indie Hackers", "iOS Dev Weekly"] },
    crowdfundingPitch: {
      title: "Bring back the icon stamper",
      story: words(150),
      fundingUse: ["Hosting", "Design", "Launch"],
      backerReward: "Early access and your name in the credits.",
    },
    aiBuildPrompt: words(200),
  };
}
