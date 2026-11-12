"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { nuevaClaveSchema } from "@/lib/validation/onboarding";
import { completarRegistroPendiente } from "@/lib/perfil";
import type { ActionResult } from "@/lib/types";

/** Guarda la contraseña nueva (la sesión viene del link de recuperación) y entra a la app. */
export async function cambiarClave(input: unknown): Promise<ActionResult> {
  const user = await getAuthedUser();
  if (!user) return { ok: false, message: "El link venció. Pedí uno nuevo." };

  const parsed = nuevaClaveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error || !data.user) {
    if (error?.code === "same_password") {
      return { ok: false, message: "La contraseña nueva tiene que ser distinta de la anterior." };
    }
    if (error?.code === "weak_password") {
      return { ok: false, message: "Esa contraseña es muy fácil de adivinar. Elegí otra." };
    }
    console.error("updateUser password", error);
    return { ok: false, message: "No se pudo cambiar la contraseña." };
  }

  // Si alguien más tenía la sesión abierta (por eso se recupera), se la cierra.
  await supabase.auth.signOut({ scope: "others" });
  // El link de recuperación también confirma el email: si el registro quedó pendiente, se completa.
  redirect(await completarRegistroPendiente(supabase, data.user));
}
