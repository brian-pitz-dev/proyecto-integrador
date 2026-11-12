"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";

/** Marca el tutorial de bienvenida como visto (en user_metadata: vale en cualquier dispositivo). */
export async function marcarTutorialVisto(): Promise<void> {
  const user = await getAuthedUser();
  if (!user || user.tutorialVisto) return;

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { tutorial_visto: true } });
  // getAuthedUser lee el JWT (getClaims): sin refrescar la sesión, el claim viejo volvería a
  // mostrar el tutorial hasta que venza el token.
  if (!error) await supabase.auth.refreshSession();
}
