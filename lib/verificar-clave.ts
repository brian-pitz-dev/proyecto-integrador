import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getClientKey, loginLimiter } from "@/lib/rate-limit";

export const claveActualSchema = z.string().min(1, "Escribí tu contraseña.").max(200);

/**
 * Vuelve a pedir la contraseña antes de algo delicado: una sesión abierta en otra compu no
 * alcanza. null si es correcta; si no, el mensaje de error. Comparte el rate limit del login.
 * Vive acá y no en un módulo "use server": exportada desde ahí, el cliente podría llamarla.
 */
export async function verificarClave(
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string,
  password: string,
): Promise<string | null> {
  const clientKey = await getClientKey();
  if (loginLimiter.isLimited(clientKey)) {
    return "Demasiados intentos. Probá de nuevo en unos minutos.";
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    loginLimiter.record(clientKey);
    return "Contraseña incorrecta.";
  }
  return null;
}
