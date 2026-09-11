"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
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

  const humanVerified = await verifyTurnstileToken(parsed.data.turnstileToken, clientKey);
  if (!humanVerified) {
    return { ok: false, message: "Verificación anti-bot fallida. Recargá la página." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    recordFailedAttempt(clientKey);
    return { ok: false, message: "Email o contraseña incorrectos." };
  }

  clearAttempts(clientKey);
  return { ok: true };
}

export async function logout(): Promise<ActionResult> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { ok: true };
}
