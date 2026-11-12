import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { completarRegistroPendiente } from "@/lib/perfil";

const TIPOS: EmailOtpType[] = ["email", "signup"];

/**
 * Destino del link de confirmación del mail (emailRedirectTo del registro). Deja la sesión
 * iniciada y crea el perfil + eventos que quedaron pendientes en el registro. Acepta los dos
 * formatos de link de Supabase:
 * - `?code=` (plantilla por defecto): Supabase ya confirmó el email y manda un código PKCE. Solo
 *   se canjea en el navegador donde se hizo el registro (ahí está la cookie code-verifier).
 * - `?token_hash=&type=` (plantilla propia, requiere SMTP propio): funciona en cualquier dispositivo.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const supabase = await createClient();

  // Supabase manda los errores en la URL (ej. otp_expired: link vencido o ya usado).
  if (params.get("error_code") || params.get("error")) {
    redirect("/login?error=confirmacion");
  }

  const code = params.get("code");
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      redirect(await completarRegistroPendiente(supabase, data.user));
    }
    // El email ya quedó confirmado; sin la cookie (otro navegador o dispositivo) no hay sesión:
    // al iniciar sesión, el login completa el registro pendiente.
    redirect("/login?confirmada=1");
  }

  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  if (tokenHash && type && TIPOS.includes(type)) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error && data.user) {
      redirect(await completarRegistroPendiente(supabase, data.user));
    }
  }

  redirect("/login?error=confirmacion");
}
