import { AppError } from "./errors";

/**
 * In-memory sliding-window limiter, per server instance.
 * It resets on cold starts; acceptable for the MVP (see CLAUDE.md).
 */
export class SlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
    private readonly maxKeys = 10_000,
  ) {}

  /** Records a hit and returns whether it was allowed, and when the oldest hit expires. */
  hit(key: string): { allowed: boolean; retryAfterMs: number } {
    const now = this.now();
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return { allowed: false, retryAfterMs: this.windowMs - (now - recent[0]) };
    }
    recent.push(now);
    this.hits.delete(key);
    this.hits.set(key, recent);
    if (this.hits.size > this.maxKeys) {
      const oldest = this.hits.keys().next().value;
      if (oldest !== undefined) this.hits.delete(oldest);
    }
    return { allowed: true, retryAfterMs: 0 };
  }

  /** Throws RATE_LIMITED with a friendly message when over the limit. */
  enforce(key: string, what: string): void {
    const { allowed, retryAfterMs } = this.hit(key);
    if (!allowed) {
      const minutes = Math.max(1, Math.ceil(retryAfterMs / 60_000));
      throw new AppError("RATE_LIMITED", `Easy, night owl. That's a lot of ${what} for now. Try again in about ${minutes} min.`);
    }
  }
}
