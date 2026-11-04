export const ERROR_STATUS = {
  BAD_REQUEST: 400,
  INVALID_URL: 400,
  PAYLOAD_TOO_LARGE: 413,
  NOT_FOUND_OR_PRIVATE: 404,
  RATE_LIMITED: 429,
  GITHUB_UNAVAILABLE: 502,
  TIMEOUT: 504,
  AI_BAD_OUTPUT: 502,
  AI_CONFIG: 500,
  AI_BUSY: 503,
  INTERNAL: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

export interface ApiErrorBody {
  error: { code: ErrorCode; message: string };
}

/** An error whose message is safe to show to users. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = ERROR_STATUS[code];
  }
}

export const INTERNAL_MESSAGE = "Something went bump in the night. Please try again.";

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  console.error("[undead] unexpected error", err);
  return new AppError("INTERNAL", INTERNAL_MESSAGE);
}

export function errorResponse(err: unknown): Response {
  const e = toAppError(err);
  return Response.json({ error: { code: e.code, message: e.message } } satisfies ApiErrorBody, {
    status: e.status,
  });
}
