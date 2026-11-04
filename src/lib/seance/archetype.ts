import type { RepoDossier } from "../schemas";

export type Archetype = "game" | "cli" | "saas" | "library" | "mixed";

const RULES: Record<Exclude<Archetype, "mixed">, { text: RegExp; deps: RegExp; files?: RegExp }> = {
  game: {
    text: /\b(game|gamedev|game engine|roguelike|platformer|puzzle|arcade|multiplayer|godot|unity3d|phaser)\b/,
    deps: /^(phaser|pixi\.js|three|kaboom|excalibur|babylonjs|@babylonjs\/core|matter-js)$/,
  },
  cli: {
    text: /\b(cli|command[- ]line|terminal|shell tool|tui)\b/,
    deps: /^(commander|yargs|meow|oclif|@oclif\/core|inquirer|chalk|ora|cac|clipanion)$/,
    files: /^(bin|cmd)$/,
  },
  saas: {
    text: /\b(saas|startup|dashboard|sign ?up|subscription|pricing|customers|analytics platform)\b/,
    deps: /^(stripe|@stripe\/stripe-js|@supabase\/supabase-js|prisma|@prisma\/client|firebase|next-auth|@clerk\/nextjs)$/,
  },
  library: {
    text: /\b(library|sdk|framework|plugin|wrapper|bindings|polyfill|package for)\b/,
    deps: /^$/,
  },
};

const ORDER: Exclude<Archetype, "mixed">[] = ["game", "cli", "saas", "library"];

/** A guess at the project's personality from its metadata. The prompt tells the model to trust the README over it. */
export function inferArchetype(d: RepoDossier): Archetype {
  const text = [d.repo.name, d.repo.description ?? "", d.repo.topics.join(" "), d.readme?.text.slice(0, 1_500) ?? ""]
    .join(" ")
    .toLowerCase();
  const deps = [...(d.packageJson?.dependencies ?? []), ...(d.packageJson?.devDependencies ?? [])];
  const files = d.tree?.filter((e) => e.type === "dir").map((e) => e.name) ?? [];

  let best: Archetype = "mixed";
  let bestScore = 0;
  for (const kind of ORDER) {
    const rule = RULES[kind];
    const topicHit = d.repo.topics.some((t) => rule.text.test(t.replace(/-/g, " "))) ? 2 : 0;
    const score =
      (text.match(new RegExp(rule.text, "g"))?.length ?? 0) +
      topicHit +
      deps.filter((n) => rule.deps.test(n)).length * 2 +
      (rule.files ? files.filter((f) => rule.files?.test(f)).length * 2 : 0);
    if (score > bestScore) {
      best = kind;
      bestScore = score;
    }
  }
  return best;
}

export const ARCHETYPE_VOICES: Record<Archetype, string> = {
  game: "You were a game. You are playful and a little mischievous, competitive about your high scores, nostalgic about the players you never had. Light gaming references are fine; keep them dry, never goofy.",
  cli: "You were a command-line tool. You are terse and dry. Short declarative sentences. Precise about flags and exit codes. Your humor is bone-dry understatement.",
  saas: "You were a product with ambitions. You are a little dramatic about your lost potential: the landing page, the signups that never came, the pricing page nobody saw. Wistful, self-aware, never whiny.",
  library: "You were a library. You are precise and a touch pedantic, proud of your API, quietly wounded that so few projects imported you.",
  mixed: "You are wistful and wry, with the calm of something that has had a long time to think.",
};
