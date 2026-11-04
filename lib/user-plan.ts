/** Punto único de carga del perfil + eventos + plan de un usuario (Server Components). */

import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { buildPlan, type Week, type UserEvent } from "@/lib/training-plan";
import { todayNormalized } from "@/lib/date";
import type { UserProfile } from "@/lib/calorie-target";

export interface Perfil extends UserProfile {
  pesoInicialKg: number;
  metaPesoKg: number | null;
  metaGrasaPct: string | null;
  planStart: string;
}

export interface UserPlanContext {
  profile: Perfil;
  events: UserEvent[];
  weeks: Week[];
}

/** null si no hay sesión o todavía no completó el onboarding (proxy.ts ya debería haber redirigido antes de llegar acá). */
export async function getUserPlanContext(): Promise<UserPlanContext | null> {
  const user = await getAuthedUser();
  if (!user) return null;

  const supabase = await createClient();
  const [{ data: perfilRow }, { data: eventoRows }] = await Promise.all([
    supabase.from("perfil").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("evento").select("*").eq("user_id", user.id).order("fecha", { ascending: true }),
  ]);

  if (!perfilRow) return null;

  const profile: Perfil = {
    edad: perfilRow.edad,
    alturaCm: Number(perfilRow.altura_cm),
    sexo: perfilRow.sexo,
    factorActividad: Number(perfilRow.factor_actividad),
    calibracionPesoKg:
      perfilRow.calibracion_peso_kg != null ? Number(perfilRow.calibracion_peso_kg) : null,
    calibracionBmrKcal:
      perfilRow.calibracion_bmr_kcal != null ? Number(perfilRow.calibracion_bmr_kcal) : null,
    pesoInicialKg: Number(perfilRow.peso_inicial_kg),
    metaPesoKg: perfilRow.meta_peso_kg != null ? Number(perfilRow.meta_peso_kg) : null,
    metaGrasaPct: perfilRow.meta_grasa_pct,
    planStart: perfilRow.plan_start,
  };

  const events: UserEvent[] = (eventoRows ?? []).map((e) => ({
    id: e.id,
    tipo: e.tipo,
    nombre: e.nombre,
    fecha: e.fecha,
    distanciaKm: Number(e.distancia_km),
    etiqueta: e.etiqueta,
    detalle: e.detalle,
  }));

  const weeks = buildPlan(profile.planStart, events, todayNormalized());

  return { profile, events, weeks };
}
