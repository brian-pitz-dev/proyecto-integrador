import { createClient } from "@/lib/supabase/server";

/**
 * Every data-modifying server action must call this before touching
 * Supabase — proxy.ts is not sufficient on its own (a matcher change or a
 * refactored route can silently drop coverage; see Next.js's data-security
 * guide). This is the defense-in-depth check each action makes for itself.
 *
 * Uses getClaims(): with the project's asymmetric (ES256) signing keys it verifies
 * the JWT signature locally against the cached JWKS — no round trip to Supabase Auth
 * (the server functions run in us-east-2, Supabase in sa-east-1). Trade-off: a session
 * revoked server-side stays valid here until the JWT expires (≤1 h); proxy.ts still
 * calls getUser() on every navigation. See specs/005-coach-ia/research.md Decision 5.
 */
export async function getAuthedUser(): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) return null;
  return { id: data.claims.sub };
}
