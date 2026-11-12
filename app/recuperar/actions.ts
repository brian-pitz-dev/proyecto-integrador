"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getClientKey, recuperarLimiter } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import type { ActionResult } from "@/lib/types";

const schema = z.object({
  email: z.string().trim().email(),
  turnstileToken: z.string().min(1),
});

/** Manda el mail para elegir una contraseña nueva. Responde lo mismo exista o no la cuenta. */
export async function pedirRecuperacion(input: {
  email: string;
  turnstileToken: string;
}): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Email inválido." };

  const clientKey = await getClientKey();
  if (recuperarLimiter.isLimited(clientKey)) {
    return { ok: false, message: "Demasiados intentos. Probá de nuevo en unos minutos." };
  }
  recuperarLimiter.record(clientKey);

  const humanVerified = await verifyTurnstileToken(
    parsed.data.turnstileToken,
    clientKey,
    "recuperar",
  );
  if (!humanVerified) {
    return { ok: false, message: "Verificación anti-bot fallida. Recargá la página." };
  }

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    // type=recovery: /auth/confirm manda a /nueva-clave en vez de completar un registro.
    redirectTo: origin ? `${origin}/auth/confirm?type=recovery` : undefined,
  });

  if (error) {
    console.error("resetPasswordForEmail", error);
    // El límite de mails de Supabase es global, no dice nada sobre si la cuenta existe.
    if (error.code === "over_email_send_rate_limit") {
      return {
        ok: false,
        message: "Se mandaron demasiados mails. Probá de nuevo en un rato.",
      };
    }
  }
  // Cualquier otro error se responde igual que el éxito: no revelar qué emails tienen cuenta.
  return { ok: true };
}
