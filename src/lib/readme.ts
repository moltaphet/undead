const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };

/** Strips HTML, badges and images from a README and collapses whitespace. */
export function cleanReadme(markdown: string): string {
  return markdown
    .replace(/\r\n?/g, "\n")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, "")
    .replace(/\[!\[[^\]]*\]\[[^\]]*\]\]\[[^\]]*\]/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/!\[[^\]]*\]\[[^\]]*\]/g, "")
    .replace(/^\s*\[[^\]]+\]:\s*\S+.*$/gm, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Truncates to maxChars, preferring a paragraph boundary, then a word boundary. */
export function truncateOnParagraph(text: string, maxChars: number): { text: string; truncated: boolean } {
  if (text.length <= maxChars) return { text, truncated: false };
  const slice = text.slice(0, maxChars - 1);
  const paragraph = slice.lastIndexOf("\n\n");
  const word = slice.lastIndexOf(" ");
  const cut = paragraph > maxChars * 0.5 ? paragraph : word > maxChars * 0.5 ? word : slice.length;
  return { text: `${slice.slice(0, cut).trimEnd()}…`, truncated: true };
}
