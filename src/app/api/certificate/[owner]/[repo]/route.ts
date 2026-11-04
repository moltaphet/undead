import { z } from "zod";
import { renderRepoCertificate } from "@/lib/certificate/render";
import { AppError, errorResponse } from "@/lib/errors";
import { clientIp } from "@/lib/http";
import { INVALID_URL_MESSAGE, isValidOwner, isValidRepo } from "@/lib/repo-url";

export const maxDuration = 120;

const formatSchema = z.enum(["landscape", "square"]).default("landscape");

/** GET /api/certificate/:owner/:repo?format=landscape|square -> PNG (falls back to a branded card on failure) */
export async function GET(request: Request, ctx: RouteContext<"/api/certificate/[owner]/[repo]">) {
  try {
    const { owner, repo } = await ctx.params;
    const format = formatSchema.safeParse(new URL(request.url).searchParams.get("format") ?? undefined);
    if (!format.success) throw new AppError("BAD_REQUEST", "format must be landscape or square.");
    if (!isValidOwner(owner) || !isValidRepo(repo)) throw new AppError("INVALID_URL", INVALID_URL_MESSAGE);
    return await renderRepoCertificate(owner, repo, format.data, clientIp(request.headers));
  } catch (err) {
    return errorResponse(err);
  }
}
