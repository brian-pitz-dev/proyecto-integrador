import { createClient } from "@/lib/supabase/server";

/**
 * Every data-modifying server action must call this before touching
 * Supabase — proxy.ts is not sufficient on its own (a matcher change or a
 * refactored route can silently drop coverage; see Next.js's data-security
 * guide). This is the defense-in-depth check each action makes for itself.
 */
export async function getAuthedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
