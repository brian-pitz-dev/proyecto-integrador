"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSignupRateLimited, recordSignupAttempt } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { registroSchema } from "@/lib/validation/onboarding";
import { guardarPerfilYEventos } from "@/lib/perfil";
import type { ActionResult } from "@/lib/types";

/** `paso`: a qué paso del registro volver para corregir (0 cuenta, 1 perfil, 2 eventos). */
export type RegistroResult = ActionResult & { paso?: number };

const PASO_POR_CAMPO: Record<string, number> = { cuenta: 0, perfil: 1, eventos: 2 };

async function getClientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

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
  if (isSignupRateLimited(clientKey)) {
    return { ok: false, message: "Demasiados intentos. Probá de nuevo en unos minutos." };
  }
  recordSignupAttempt(clientKey);

  const humanVerified = await verifyTurnstileToken(parsed.data.turnstileToken, clientKey, "signup");
  if (!humanVerified) {
    return { ok: false, message: "Verificación anti-bot fallida. Probá de nuevo." };
  }

  const { cuenta, perfil, eventos } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: cuenta.email,
    password: cuenta.password,
    options: {
      // Nombre y aceptación de términos viven en user_metadata: sobreviven aunque falle el perfil.
      data: { nombre: cuenta.nombre, terminos_aceptados_at: new Date().toISOString() },
    },
  });

  if (error) {
    const yaExiste =
      error.code === "user_already_exists" || /already registered/i.test(error.message);
    return {
      ok: false,
      paso: 0,
      message: yaExiste
        ? "Ya existe una cuenta con ese email. Iniciá sesión o usá otro email."
        : "No se pudo crear la cuenta: " + error.message,
    };
  }

  // Si el proyecto exigiera confirmar el email no habría sesión: no se puede guardar el perfil (RLS).
  if (!data.session || !data.user) {
    return {
      ok: true,
      message:
        "Te mandamos un email para confirmar la cuenta. Confirmala, iniciá sesión y completá tu perfil.",
    };
  }

  const perfilError = await guardarPerfilYEventos(supabase, data.user.id, perfil, eventos);
  // La cuenta ya existe: si falló el perfil, se termina en /onboarding (mismos pasos 2 y 3).
  if (perfilError) redirect("/onboarding");

  revalidatePath("/calendario");
  redirect("/calendario");
}
