"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { onboardingSchema } from "@/lib/validation/onboarding";
import { toISO, todayNormalized } from "@/lib/date";
import type { ActionResult } from "@/lib/types";
import type { z } from "zod";

type OnboardingInput = z.infer<typeof onboardingSchema>;

export async function completeOnboarding(input: OnboardingInput): Promise<ActionResult> {
  const user = await getAuthedUser();
  if (!user) {
    return { ok: false, message: "No autenticado." };
  }

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const data = parsed.data;

  const supabase = await createClient();

  const { error: perfilError } = await supabase.from("perfil").upsert({
    user_id: user.id,
    edad: data.edad,
    altura_cm: data.alturaCm,
    sexo: data.sexo,
    peso_inicial_kg: data.pesoInicialKg,
    factor_actividad: data.factorActividad,
    meta_peso_kg: data.metaPesoKg ?? null,
    meta_grasa_pct: data.metaGrasaPct ?? null,
    calibracion_peso_kg: data.calibracionPesoKg ?? null,
    calibracion_bmr_kcal: data.calibracionBmrKcal ?? null,
    plan_start: toISO(todayNormalized()),
  });
  if (perfilError) {
    return { ok: false, message: "No se pudo guardar el perfil: " + perfilError.message };
  }

  // Por si este submit es un reintento tras un fallo parcial: evita duplicar eventos.
  const { error: deleteError } = await supabase.from("evento").delete().eq("user_id", user.id);
  if (deleteError) {
    return { ok: false, message: "No se pudieron guardar los eventos: " + deleteError.message };
  }

  const { error: eventosError } = await supabase.from("evento").insert(
    data.eventos.map((e) => ({
      user_id: user.id,
      tipo: e.tipo,
      nombre: e.nombre,
      fecha: e.fecha,
      distancia_km: e.distanciaKm,
    })),
  );
  if (eventosError) {
    return { ok: false, message: "No se pudieron guardar los eventos: " + eventosError.message };
  }

  const { error: metaError } = await supabase.auth.updateUser({
    data: { onboarding_completed: true },
  });
  if (metaError) {
    return { ok: false, message: "No se pudo completar el registro: " + metaError.message };
  }

  revalidatePath("/calendario");
  revalidatePath("/nutricion");
  revalidatePath("/estadisticas");
  return { ok: true };
}
