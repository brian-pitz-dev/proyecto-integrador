"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClientKey, signupLimiter } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { registroSchema } from "@/lib/validation/onboarding";
import { guardarPerfilYEventos } from "@/lib/perfil";
import type { ActionResult } from "@/lib/types";

/**
 * `paso`: a qué paso del registro volver para corregir (0 cuenta, 1 perfil, 2 eventos).
 * `confirmar`: el email al que se mandó el link de confirmación (la cuenta todavía no tiene sesión).
 */
export type RegistroResult = ActionResult & { paso?: number; confirmar?: string };

const PASO_POR_CAMPO: Record<string, number> = { cuenta: 0, perfil: 1, eventos: 2 };

/** Registro en pasos: crea la cuenta, guarda perfil + eventos y entra a la app, en un solo envío. */
// input: unknown — viene del navegador; zod valida todo (los pasos ya se validaron en el cliente).
export async function registrar(input: unknown): Promise<RegistroResult> {
  const parsed = registroSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      message: issue?.message ?? "Datos inválidos.",
      paso: PASO_POR_CAMPO[String(issue?.path[0])],
    };
  }

  const clientKey = await getClientKey();
  if (signupLimiter.isLimited(clientKey)) {
    return { ok: false, message: "Demasiados intentos. Probá de nuevo en unos minutos." };
  }
  signupLimiter.record(clientKey);

  const humanVerified = await verifyTurnstileToken(parsed.data.turnstileToken, clientKey, "signup");
  if (!humanVerified) {
    return { ok: false, message: "Verificación anti-bot fallida. Probá de nuevo." };
  }

  const { cuenta, perfil, eventos } = parsed.data;
  const h = await headers();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: cuenta.email,
    password: cuenta.password,
    options: {
      // El link del mail vuelve a /auth/confirm del mismo sitio desde el que se registró (prod o
      // localhost). Supabase solo lo acepta si está en Redirect URLs; si no, usa el Site URL.
      emailRedirectTo: h.get("origin") ? `${h.get("origin")}/auth/confirm` : undefined,
      data: {
        nombre: cuenta.nombre,
        terminos_aceptados_at: new Date().toISOString(),
        // Sin sesión hasta confirmar el email no se puede guardar el perfil (RLS): viaja acá y
        // lo crea completarRegistroPendiente (lib/perfil.ts) al confirmar o al iniciar sesión.
        registro_pendiente: { perfil, eventos },
      },
    },
  });

  if (error) {
    console.error("signUp", error);
    const yaExiste =
      error.code === "user_already_exists" || /already registered/i.test(error.message);
    return {
      ok: false,
      paso: 0,
      message: yaExiste
        ? "Ya existe una cuenta con ese email. Iniciá sesión o usá otro email."
        : "No se pudo crear la cuenta, probá de nuevo en unos minutos.",
    };
  }

  // El proyecto exige confirmar el email: sin sesión todavía. El perfil se crea al confirmar.
  if (!data.session || !data.user) {
    return { ok: true, confirmar: cuenta.email };
  }

  const perfilError = await guardarPerfilYEventos(supabase, data.user.id, perfil, eventos);
  // La cuenta ya existe: si falló el perfil, se termina en /onboarding (mismos pasos 2 y 3).
  if (perfilError) redirect("/onboarding");

  revalidatePath("/calendario");
  redirect("/calendario");
}
