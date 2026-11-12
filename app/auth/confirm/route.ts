import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { completarRegistroPendiente } from "@/lib/perfil";

const TIPOS: EmailOtpType[] = ["email", "signup"];

/**
 * Destino del link de confirmación del mail (plantilla "Confirm signup" de Supabase:
 * {{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email). Valida el token,
 * deja la sesión iniciada y crea el perfil + eventos que quedaron pendientes en el registro.
 * Con token_hash (no PKCE) funciona aunque el mail se abra en otro dispositivo.
 */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type && TIPOS.includes(type)) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error && data.user) {
      redirect(await completarRegistroPendiente(supabase, data.user));
    }
  }

  // Link vencido, ya usado o inválido.
  redirect("/login?error=confirmacion");
}
