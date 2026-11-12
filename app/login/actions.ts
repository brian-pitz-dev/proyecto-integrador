"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { completarRegistroPendiente } from "@/lib/perfil";
import type { ActionResult } from "@/lib/types";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  turnstileToken: z.string().min(1),
});

async function getClientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function login(input: {
  email: string;
  password: string;
  turnstileToken: string;
}): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Datos inválidos." };
  }

  const clientKey = await getClientKey();
  if (isRateLimited(clientKey)) {
    return { ok: false, message: "Demasiados intentos. Probá de nuevo en unos minutos." };
  }

  const humanVerified = await verifyTurnstileToken(parsed.data.turnstileToken, clientKey, "login");
  if (!humanVerified) {
    return { ok: false, message: "Verificación anti-bot fallida. Recargá la página." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        ok: false,
        message: "Confirmá tu email con el link que te mandamos antes de ingresar.",
      };
    }
    recordFailedAttempt(clientKey);
    return { ok: false, message: "Email o contraseña incorrectos." };
  }

  clearAttempts(clientKey);
  // Redirect en el server: la acción y la página destino viajan en una sola respuesta.
  // Ese render no pasa por proxy.ts, así que acá se decide si falta el onboarding
  // (y, si el registro quedó pendiente de confirmar el email, se completa ahora).
  redirect(await completarRegistroPendiente(supabase, data.user));
}

export async function logout(): Promise<ActionResult> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
