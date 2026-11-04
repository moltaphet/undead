import { z } from "zod";

export const ingestRequestSchema = z.object({ url: z.string().max(300) });

export const repoStatusSchema = z.enum(["alive", "dormant", "dead"]);
export type RepoStatus = z.infer<typeof repoStatusSchema>;

export const repoDossierSchema = z.object({
  repo: z.object({
    owner: z.string(),
    name: z.string(),
    fullName: z.string(),
    description: z.string().nullable(),
    url: z.string(),
    homepage: z.string().nullable(),
    avatarUrl: z.string(),
    stars: z.number().int(),
    forks: z.number().int(),
    watchers: z.number().int(),
    openIssues: z.number().int(),
    language: z.string().nullable(),
    topics: z.array(z.string()),
    license: z.string().nullable(),
    createdAt: z.string(),
    pushedAt: z.string(),
    archived: z.boolean(),
    isFork: z.boolean(),
    defaultBranch: z.string(),
  }),
  readme: z.object({ text: z.string(), truncated: z.boolean() }).nullable(),
  commits: z
    .array(z.object({ sha: z.string(), message: z.string(), author: z.string().nullable(), date: z.string() }))
    .nullable(),
  languages: z.array(z.object({ name: z.string(), percent: z.number() })).nullable(),
  tree: z.array(z.object({ name: z.string(), type: z.enum(["file", "dir"]) })).nullable(),
  packageJson: z
    .object({
      name: z.string().nullable(),
      description: z.string().nullable(),
      dependencies: z.array(z.string()),
      devDependencies: z.array(z.string()),
      scripts: z.array(z.string()),
    })
    .nullable(),
  openIssueTitles: z.array(z.string()).nullable(),
  signals: z.object({
    ageDays: z.number().int(),
    daysSinceLastPush: z.number().int(),
    status: repoStatusSchema,
    commitCadence: z.object({
      perWeek: z.number(),
      sampleSize: z.number().int(),
      firstCommitDate: z.string().nullable(),
      lastCommitDate: z.string().nullable(),
    }),
    lastWords: z.string().nullable(),
    hasHomepage: z.boolean(),
    hasLicense: z.boolean(),
    hasTests: z.boolean(),
  }),
  /** Honest notes about missing or partial data, shown to the AI and the user. */
  notes: z.array(z.string()),
  fetchedAt: z.string(),
});

export type RepoDossier = z.infer<typeof repoDossierSchema>;

export const DIAGNOSIS_FACTORS = [
  "scope_creep",
  "no_users",
  "no_distribution",
  "tech_debt",
  "lost_interest",
  "outcompeted",
  "unclear_value",
  "platform_shift",
  "solo_burnout",
  "never_finished",
] as const;

export const MARKET_VERDICTS = ["stronger", "same", "weaker", "gone"] as const;

/** What the model must return. `lastWords` is injected from the dossier in code, never generated. */
export const autopsyModelSchema = z.object({
  causeOfDeath: z.object({
    headline: z.string().trim().min(1).max(90),
    explanation: z.string().trim().min(1).max(900),
  }),
  timeOfDeath: z.object({ date: z.string().trim().min(1), note: z.string().trim().min(1).max(300) }),
  diagnosis: z
    .array(
      z.object({
        factor: z.enum(DIAGNOSIS_FACTORS),
        severity: z.number().int().min(1).max(5),
        evidence: z.string().trim().min(1).max(400),
      }),
    )
    .min(2)
    .max(4),
  worthSaving: z.array(z.string().trim().min(1).max(220)).min(2).max(4),
  marketToday: z.object({ verdict: z.enum(MARKET_VERDICTS), reasoning: z.string().trim().min(1).max(700) }),
  revivalScore: z.number().int().min(0).max(100),
  revivalScoreReason: z.string().trim().min(1).max(300),
  epitaph: z.string().trim().min(1).max(70),
});

export const autopsySchema = autopsyModelSchema.extend({ lastWords: z.string().nullable() });

export type Autopsy = z.infer<typeof autopsySchema>;
export type DiagnosisFactor = (typeof DIAGNOSIS_FACTORS)[number];
export type MarketVerdict = (typeof MARKET_VERDICTS)[number];

const str = (max: number) => z.string().trim().min(1).max(max);

export const resurrectionSchema = z.object({
  /** Required when the revival score is under 25; null otherwise. */
  honestNote: z.string().trim().max(700).nullable(),
  newPositioning: z.object({
    oneLiner: str(80),
    targetUser: str(220),
    painPoint: str(450),
    whyNow: str(550),
  }),
  mvpCut: z.object({
    keep: z.array(str(220)).min(2).max(4),
    kill: z.array(str(260)).min(2).max(4),
    build: z.array(str(260)).min(1).max(3),
  }),
  sevenDayPlan: z
    .array(z.object({ day: z.number().int().min(1).max(7), title: str(90), tasks: z.array(str(240)).min(2).max(4) }))
    .length(7),
  landingCopy: z.object({
    headline: str(90),
    subheadline: str(240),
    bullets: z.array(str(170)).length(3),
    cta: str(40),
  }),
  launchPosts: z.object({ x: str(260), firstUsersWhere: z.array(str(280)).length(3) }),
  crowdfundingPitch: z.object({
    title: str(90),
    story: str(1_600),
    fundingUse: z.array(str(220)).length(3),
    backerReward: str(320),
  }),
  aiBuildPrompt: str(2_800),
});

export type Resurrection = z.infer<typeof resurrectionSchema>;

export const SEANCE_LIMITS = { maxMessages: 20, userChars: 1_000, assistantChars: 3_000, maxBodyBytes: 65_536 } as const;

const seanceMessage = z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1) });

/**
 * Empty messages = the opening request (the ghost speaks first).
 * Otherwise: starts with the ghost's opening line, alternates, ends with the user.
 */
export const seanceRequestSchema = z
  .object({
    owner: z.string().min(1).max(39),
    repo: z.string().min(1).max(100),
    messages: z.array(seanceMessage).max(SEANCE_LIMITS.maxMessages),
  })
  .superRefine(({ messages }, ctx) => {
    messages.forEach((m, i) => {
      const cap = m.role === "user" ? SEANCE_LIMITS.userChars : SEANCE_LIMITS.assistantChars;
      if (m.content.length > cap) ctx.addIssue({ code: "custom", path: ["messages", i], message: `Message too long (max ${cap}).` });
      const expected = i % 2 === 0 ? "assistant" : "user";
      if (m.role !== expected) ctx.addIssue({ code: "custom", path: ["messages", i], message: "Roles must alternate, starting with the ghost." });
    });
    if (messages.length > 0 && messages[messages.length - 1].role !== "user") {
      ctx.addIssue({ code: "custom", path: ["messages"], message: "The last message must be from the user." });
    }
  });

export type SeanceRequest = z.infer<typeof seanceRequestSchema>;
export type SeanceMessage = SeanceRequest["messages"][number];
