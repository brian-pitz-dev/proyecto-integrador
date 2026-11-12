"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { onboardingSchema } from "@/lib/validation/onboarding";
import { guardarPerfilYEventos } from "@/lib/perfil";
import type { ActionResult } from "@/lib/types";

/** Respaldo: cuenta ya creada pero sin perfil (p. ej. si falló el guardado al final del registro). */
export async function completeOnboarding(input: unknown): Promise<ActionResult> {
  const user = await getAuthedUser();
  if (!user) {
    return { ok: false, message: "No autenticado." };
  }

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const { eventos, ...perfil } = parsed.data;

  const supabase = await createClient();
  const error = await guardarPerfilYEventos(supabase, user.id, perfil, eventos);
  if (error) return { ok: false, message: error };

  revalidatePath("/calendario");
  revalidatePath("/nutricion");
  revalidatePath("/estadisticas");
  redirect("/calendario");
}
