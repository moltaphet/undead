import { LIMITS } from "@/lib/config";
import { AppError, errorResponse } from "@/lib/errors";
import { clientIp, readJsonBody } from "@/lib/http";
import { getReport } from "@/lib/report";
import { INVALID_URL_MESSAGE, tryParseRepoUrl } from "@/lib/repo-url";
import { ingestRequestSchema } from "@/lib/schemas";

export const maxDuration = 120;

/** POST /api/autopsy { url } -> { dossier, autopsy } | { error } */
export async function POST(request: Request) {
  try {
    const { url } = await readJsonBody(request, ingestRequestSchema, LIMITS.ingest.maxBodyBytes);
    const ref = tryParseRepoUrl(url);
    if (!ref) throw new AppError("INVALID_URL", INVALID_URL_MESSAGE);
    return Response.json(await getReport(ref, clientIp(request.headers)));
  } catch (err) {
    return errorResponse(err);
  }
}
