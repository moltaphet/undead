/** Characters per second at rest; speeds up when the received text runs far ahead. */
const BASE_CPS = 50;
const CATCH_UP_AFTER = 120;

/**
 * How many characters should be visible after `dtMs`, given what has been received.
 * Pure, so the pacing is testable. Never reveals more than received.
 */
export function nextReveal(revealed: number, received: number, dtMs: number, reducedMotion: boolean): number {
  if (reducedMotion || revealed >= received) return received;
  const lag = received - revealed;
  const cps = lag > CATCH_UP_AFTER ? BASE_CPS * (lag / CATCH_UP_AFTER) * 2 : BASE_CPS;
  const step = Math.max(1, Math.floor((cps * dtMs) / 1000));
  return Math.min(received, revealed + step);
}
