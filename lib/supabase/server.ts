import { createServerClient } from "@supabase/ssr";

/**
 * Sin autenticación en esta etapa (ver Clarifications en spec.md), por lo que no
 * hay sesión de usuario que sincronizar vía cookies — solo se usa el anon key,
 * igual que la app actual.
 */
export function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  );
}
