/** Punto único de carga del perfil + eventos + plan de un usuario (Server Components). */

import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { buildPlan, type Disponibilidad, type Week, type UserEvent } from "@/lib/training-plan";
import { edadDesde, todayNormalized } from "@/lib/date";
import type { UserProfile } from "@/lib/calorie-target";
import type { MealBank } from "@/lib/meal-plan";
import type { Routine } from "@/lib/gym-exercises";
import { mealBankSchema, routinesSchema } from "@/lib/validation/coach";
import { historialDisponibilidadSchema } from "@/lib/validation/onboarding";

export interface Perfil extends UserProfile {
  pesoInicialKg: number;
  metaPesoKg: number | null;
  metaGrasaPct: string | null;
  planStart: string;
  /** null en cuentas previas a la fecha de nacimiento (solo guardaban la edad). */
  fechaNacimiento: string | null;
  disponibilidad: Disponibilidad;
}

export interface PlanIa {
  comidas?: MealBank;
  ejercicios?: Record<string, Routine>;
  /** ISO timestamps de la última generación, para avisar si los eventos/perfil cambiaron después. */
  comidasUpdatedAt?: string;
  ejerciciosUpdatedAt?: string;
}

export interface UserPlanContext {
  profile: Perfil;
  events: UserEvent[];
  weeks: Week[];
  planIa: PlanIa;
}

/** null si no hay sesión o todavía no completó el onboarding (proxy.ts ya debería haber redirigido antes de llegar acá). */
export async function getUserPlanContext(): Promise<UserPlanContext | null> {
  const user = await getAuthedUser();
  if (!user) return null;

  const supabase = await createClient();
  const [{ data: perfilRow }, { data: eventoRows }, { data: planIaRows }] = await Promise.all([
    supabase.from("perfil").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("evento").select("*").eq("user_id", user.id).order("fecha", { ascending: true }),
    supabase.from("plan_ia").select("tipo, contenido, updated_at").eq("user_id", user.id),
  ]);

  if (!perfilRow) return null;

  const profile: Perfil = {
    // con fecha de nacimiento la edad se mantiene al día; las cuentas previas guardaban solo la edad
    edad: perfilRow.fecha_nacimiento ? edadDesde(perfilRow.fecha_nacimiento) : perfilRow.edad,
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
    fechaNacimiento: perfilRow.fecha_nacimiento ?? null,
    disponibilidad: {
      dias: perfilRow.dias_entrenamiento ?? [0, 1, 2, 3, 4, 5],
      minutos: perfilRow.minutos_sesion ?? 60,
    },
  };

  const events: UserEvent[] = (eventoRows ?? []).map((e) => ({
    id: e.id,
    tipo: e.tipo,
    nombre: e.nombre,
    fecha: e.fecha,
    distanciaKm: Number(e.distancia_km),
    ritmoObjetivoSeg: e.ritmo_objetivo_seg ?? null,
    etiqueta: e.etiqueta,
    detalle: e.detalle,
  }));

  // si la fila no valida (o falta la columna) las semanas pasadas toman la disponibilidad actual
  const historial =
    historialDisponibilidadSchema.safeParse(perfilRow.disponibilidad_historial).data ?? [];
  const weeks = buildPlan(
    profile.planStart,
    events,
    todayNormalized(),
    profile.disponibilidad,
    historial,
  );

  // Se re-valida al leer: si una fila no cumple el schema, se ignora y queda el plan base.
  const planIa: PlanIa = {};
  for (const row of planIaRows ?? []) {
    if (row.tipo === "comidas") {
      const parsed = mealBankSchema.safeParse(row.contenido);
      if (parsed.success) {
        planIa.comidas = parsed.data;
        planIa.comidasUpdatedAt = row.updated_at;
      }
    } else if (row.tipo === "ejercicios") {
      const parsed = routinesSchema.safeParse(row.contenido);
      if (parsed.success) {
        planIa.ejercicios = parsed.data;
        planIa.ejerciciosUpdatedAt = row.updated_at;
      }
    }
  }

  return { profile, events, weeks, planIa };
}
