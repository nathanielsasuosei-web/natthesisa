/**
 * Per-key attempt limiter shared by sign-in, password-reset requests and
 * reset submissions.
 *
 * The counter lives in memory, which is enough for a single instance; move it
 * to Redis if you run many. Keys are built by the callers (email + address),
 * so one noisy visitor cannot lock out someone else's account.
 */

interface Record {
  count: number;
  resetAt: number;
}

const g = globalThis as unknown as { __codaraAttempts?: Map<string, Record> };

export const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
export const ATTEMPT_LIMIT = 8;

function attempts(): Map<string, Record> {
  if (!g.__codaraAttempts) g.__codaraAttempts = new Map();
  return g.__codaraAttempts;
}

/**
 * Seconds the key must wait before trying again, or 0 when it may try now.
 * The UI turns this into a live countdown rather than a dead-end message.
 */
export function retryAfterSeconds(key: string, limit = ATTEMPT_LIMIT): number {
  const record = attempts().get(key);
  if (!record) return 0;
  if (Date.now() > record.resetAt) {
    attempts().delete(key);
    return 0;
  }
  if (record.count < limit) return 0;
  return Math.max(1, Math.ceil((record.resetAt - Date.now()) / 1000));
}

/** Counts one attempt (a failure, or any request for limiters that count all). */
export function noteAttempt(key: string, windowMs = ATTEMPT_WINDOW_MS): void {
  const record = attempts().get(key);
  if (!record || Date.now() > record.resetAt) {
    attempts().set(key, { count: 1, resetAt: Date.now() + windowMs });
    return;
  }
  record.count += 1;
}

/** A successful sign-in clears the failures that led up to it. */
export function clearAttempts(key: string): void {
  attempts().delete(key);
}
