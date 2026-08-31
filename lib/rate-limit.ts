const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

// ponytail: process-local map, lost on restart/cold start and not shared
// across instances — fine for a single-instance Netlify deploy; move to a
// shared store (e.g. Upstash Ratelimit) only if the deploy target ever
// becomes multi-instance.
const attempts = new Map<string, { count: number; windowStart: number }>();

/** Returns true if `key` (e.g. client IP) is currently rate-limited. */
export function isRateLimited(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) return false;

  if (Date.now() - entry.windowStart > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }

  return entry.count >= MAX_ATTEMPTS;
}

/** Records a failed attempt for `key`, starting a new window if needed. */
export function recordFailedAttempt(key: string): void {
  const entry = attempts.get(key);
  const now = Date.now();

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    attempts.set(key, { count: 1, windowStart: now });
    return;
  }

  entry.count += 1;
}

/** Clears the counter for `key` on a successful login. */
export function clearAttempts(key: string): void {
  attempts.delete(key);
}
