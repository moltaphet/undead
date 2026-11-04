import { LIMITS } from "@/lib/config";
import { getDossier } from "@/lib/dossier";
import { AppError, errorResponse } from "@/lib/errors";
import { readJsonBody } from "@/lib/http";
import { INVALID_URL_MESSAGE, tryParseRepoUrl } from "@/lib/repo-url";
import { ingestRequestSchema } from "@/lib/schemas";

export const maxDuration = 30;

/** POST /api/ingest { url } -> { dossier } | { error: { code, message } } */
export async function POST(request: Request) {
  try {
    const { url } = await readJsonBody(request, ingestRequestSchema, LIMITS.ingest.maxBodyBytes);
    const ref = tryParseRepoUrl(url);
    if (!ref) throw new AppError("INVALID_URL", INVALID_URL_MESSAGE);
    return Response.json({ dossier: await getDossier(ref) });
  } catch (err) {
    return errorResponse(err);
  }
}
