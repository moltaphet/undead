import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const dir = join(process.cwd(), "assets/fonts");

const [frauncesSemi, frauncesItalic, interMedium, mono] = await Promise.all([
  readFile(join(dir, "fraunces-latin-600-normal.woff")),
  readFile(join(dir, "fraunces-latin-400-italic.woff")),
  readFile(join(dir, "inter-latin-500-normal.woff")),
  readFile(join(dir, "jetbrains-mono-latin-500-normal.woff")),
]);

export const CERTIFICATE_FONTS = [
  { name: "Fraunces", data: frauncesSemi, weight: 600 as const, style: "normal" as const },
  { name: "Fraunces", data: frauncesItalic, weight: 400 as const, style: "italic" as const },
  { name: "Inter", data: interMedium, weight: 500 as const, style: "normal" as const },
  { name: "JetBrains Mono", data: mono, weight: 500 as const, style: "normal" as const },
];
