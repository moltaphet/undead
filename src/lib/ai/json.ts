/** Finds the outermost JSON object in model text (tolerates fences and stray prose) and parses it. */
export function extractJsonObject(text: string): unknown {
  const unfenced = text.replace(/```(?:json)?/gi, "");
  const start = unfenced.indexOf("{");
  if (start === -1) throw new SyntaxError("No JSON object found in the response.");

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < unfenced.length; i++) {
    const ch = unfenced[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return JSON.parse(unfenced.slice(start, i + 1));
  }
  throw new SyntaxError("The JSON object in the response is incomplete.");
}
