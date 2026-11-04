import { errorResponse } from "@/lib/errors";
import { clientIp, readJsonBody } from "@/lib/http";
import { buildSeancePrompt } from "@/lib/prompts/seance";
import { SlidingWindowLimiter } from "@/lib/rate-limit";
import { getReport, parseRefParams } from "@/lib/report";
import { SEANCE_LIMITS, seanceRequestSchema } from "@/lib/schemas";
import { createSeanceStream } from "@/lib/seance/stream";

export const maxDuration = 120;

const limiter = new SlidingWindowLimiter(40, 10 * 60_000);

/**
 * POST /api/seance { owner, repo, messages } -> text/plain stream of the ghost's reply.
 * The dossier and autopsy always come from the server's cache, never from the client.
 */
export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request, seanceRequestSchema, SEANCE_LIMITS.maxBodyBytes);
    const ref = parseRefParams(body.owner, body.repo);
    const ip = clientIp(request.headers);
    limiter.enforce(ip, "séance messages");
    const { dossier, autopsy } = await getReport(ref, ip);
    const stream = await createSeanceStream(buildSeancePrompt(dossier, autopsy), body.messages, request.signal);
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
