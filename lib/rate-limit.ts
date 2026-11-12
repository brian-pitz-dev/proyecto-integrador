import { headers } from "next/headers";

// ponytail: process-local maps, lost on restart/cold start and not shared
// across instances — fine for a single-instance Netlify deploy; move to a
// shared store (e.g. Upstash Ratelimit) only if the deploy target ever
// becomes multi-instance.
function limiter(windowMs: number, max: number) {
  const attempts = new Map<string, { count: number; windowStart: number }>();
  return {
    /** true si `key` ya llegó al máximo en la ventana actual. */
    isLimited(key: string): boolean {
      const entry = attempts.get(key);
      if (!entry) return false;
      if (Date.now() - entry.windowStart > windowMs) {
        attempts.delete(key);
        return false;
      }
      return entry.count >= max;
    },
    /** Suma un intento; si la ventana anterior venció, arranca una nueva. */
    record(key: string): void {
      const entry = attempts.get(key);
      const now = Date.now();
      if (!entry || now - entry.windowStart > windowMs) {
        attempts.set(key, { count: 1, windowStart: now });
        return;
      }
      entry.count += 1;
    },
    clear(key: string): void {
      attempts.delete(key);
    },
  };
}

/** Login: 5 intentos fallidos cada 5 minutos, por IP. */
export const loginLimiter = limiter(5 * 60 * 1000, 5);
/** Registro: 5 intentos cada 5 minutos, por IP. */
export const signupLimiter = limiter(5 * 60 * 1000, 5);
/** saveLog: 20 registros por minuto, por usuario. */
export const saveLogLimiter = limiter(60 * 1000, 20);
/** Coach: 5 llamadas por minuto, por usuario (protege el límite por minuto del tier gratis de Gemini). */
export const coachLimiter = limiter(60 * 1000, 5);

/** IP del cliente para los límites de login y registro. */
export async function getClientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
