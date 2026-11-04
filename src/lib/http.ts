import type { z } from "zod";
import { AppError } from "./errors";

/** Reads a JSON body with a hard byte cap, then validates it with zod. */
export async function readJsonBody<S extends z.ZodType>(request: Request, schema: S, maxBytes: number): Promise<z.infer<S>> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new AppError("PAYLOAD_TOO_LARGE", "That request is too large.");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new AppError("PAYLOAD_TOO_LARGE", "That request is too large.");
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new AppError("BAD_REQUEST", "The request body must be JSON.");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new AppError("BAD_REQUEST", "The request body is missing or malformed.");
  return parsed.data;
}

/** Best-effort client IP. On Vercel, x-forwarded-for is set by the platform. */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
