const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const SAVE_LOG_WINDOW_MS = 60 * 1000;
const SAVE_LOG_MAX_SAVES = 20;

type Attempts = Map<string, { count: number; windowStart: number }>;

// ponytail: process-local maps, lost on restart/cold start and not shared
// across instances — fine for a single-instance Netlify deploy; move to a
// shared store (e.g. Upstash Ratelimit) only if the deploy target ever
// becomes multi-instance.
const loginAttempts: Attempts = new Map();
const saveLogAttempts: Attempts = new Map();

function isLimited(attempts: Attempts, key: string, windowMs: number, max: number): boolean {
  const entry = attempts.get(key);
  if (!entry) return false;

  if (Date.now() - entry.windowStart > windowMs) {
    attempts.delete(key);
    return false;
  }

  return entry.count >= max;
}

function record(attempts: Attempts, key: string, windowMs: number): void {
  const entry = attempts.get(key);
  const now = Date.now();

  if (!entry || now - entry.windowStart > windowMs) {
    attempts.set(key, { count: 1, windowStart: now });
    return;
  }

  entry.count += 1;
}

/** Returns true if `key` (e.g. client IP) is currently rate-limited. */
export function isRateLimited(key: string): boolean {
  return isLimited(loginAttempts, key, WINDOW_MS, MAX_ATTEMPTS);
}

/** Records a failed attempt for `key`, starting a new window if needed. */
export function recordFailedAttempt(key: string): void {
  record(loginAttempts, key, WINDOW_MS);
}

/** Clears the counter for `key` on a successful login. */
export function clearAttempts(key: string): void {
  loginAttempts.delete(key);
}

/** Returns true if `userId` is currently rate-limited on saveLog. */
export function isSaveLogRateLimited(userId: string): boolean {
  return isLimited(saveLogAttempts, userId, SAVE_LOG_WINDOW_MS, SAVE_LOG_MAX_SAVES);
}

/** Records a saveLog attempt for `userId`, starting a new window if needed. */
export function recordSaveLogAttempt(userId: string): void {
  record(saveLogAttempts, userId, SAVE_LOG_WINDOW_MS);
}
