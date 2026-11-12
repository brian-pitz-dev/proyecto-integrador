"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSignupRateLimited, recordSignupAttempt } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { signupSchema } from "@/lib/validation/onboarding";
import type { ActionResult } from "@/lib/types";

async function getClientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function signup(input: {
  email: string;
  password: string;
  turnstileToken: string;
}): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const clientKey = await getClientKey();
  if (isSignupRateLimited(clientKey)) {
    return { ok: false, message: "Demasiados intentos. Probá de nuevo en unos minutos." };
  }
  recordSignupAttempt(clientKey);

  const humanVerified = await verifyTurnstileToken(parsed.data.turnstileToken, clientKey, "signup");
  if (!humanVerified) {
    return { ok: false, message: "Verificación anti-bot fallida. Recargá la página." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, message: "No se pudo crear la cuenta: " + error.message };
  }

  redirect("/onboarding");
}
