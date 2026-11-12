import { createClient } from "@/lib/supabase/server";
import { getPhaseKeyForDate, type Week } from "@/lib/training-plan";
import type { Registro } from "@/lib/types";
import { toISO } from "@/lib/date";

export interface UserProfile {
  edad: number;
  alturaCm: number;
  sexo: "M" | "F";
  factorActividad: number;
  calibracionPesoKg?: number | null;
  calibracionBmrKcal?: number | null;
}

/** Mifflin-St Jeor: +5 para hombres, -161 para mujeres. */
function mifflin(peso: number, profile: UserProfile): number {
  const base = 10 * peso + 6.25 * profile.alturaCm - 5 * profile.edad;
  return profile.sexo === "M" ? base + 5 : base - 161;
}

/** BMR calibrado con una referencia real (ej. InBody) si el usuario la cargó; si no, Mifflin-St Jeor puro. */
export function computeBmrCalibrado(peso: number, profile: UserProfile): number {
  const factor =
    profile.calibracionPesoKg && profile.calibracionBmrKcal
      ? profile.calibracionBmrKcal / mifflin(profile.calibracionPesoKg, profile)
      : 1;
  return mifflin(peso, profile) * factor;
}

const deficitPorFase: Record<string, number> = {
  p1: 400,
  p2: 350,
  p3: 130, // reactivación post-evento: priorizar recuperación sobre bajar de peso
  p4: 150, // construcción carrera larga: casi mantenimiento, energía para sostener la carga
  p5: 100, // tapering: casi mantenimiento + carga de carbohidratos
  p6: 550,
};

/** Déficit del día según la fase del plan; 400 si la fecha cae fuera del plan. */
export function deficitDeFase(phaseKey: string | null): number {
  return (phaseKey && deficitPorFase[phaseKey]) || 400;
}

export interface CalorieTarget {
  meta: number;
  gastoCalorico: number;
  deficit: number;
  fuente: "xiaomi" | "estimado";
  /** Último peso registrado: lo usa Nutrición para el umbral/objetivo de proteína. */
  pesoKg: number;
}

/** Equivalente a getCalorieTarget() de plan_vida_2026.html, generalizado por usuario. */
export async function getCalorieTarget(
  dateObj: Date,
  profile: UserProfile,
  weeks: Week[],
): Promise<CalorieTarget | null> {
  const phaseKey = getPhaseKeyForDate(weeks, dateObj);
  const fechaISO = toISO(dateObj);
  const supabase = await createClient();

  const [{ data: logDelDia }, { data: pesoLogs }] = await Promise.all([
    supabase
      .from("registro")
      .select("*")
      .eq("categoria", "calorias")
      .eq("fecha", fechaISO)
      .limit(1)
      .maybeSingle<Registro>(),
    supabase
      .from("registro")
      .select("*")
      .eq("categoria", "peso")
      .order("fecha", { ascending: false })
      .limit(1),
  ]);

  if (!pesoLogs || pesoLogs.length === 0) return null;

  const pesoActual = Number((pesoLogs[0] as Registro).valor);
  const bmrCalibrado = computeBmrCalibrado(pesoActual, profile);

  let gastoCalorico: number;
  let fuente: CalorieTarget["fuente"];
  if (logDelDia) {
    gastoCalorico = bmrCalibrado + Number(logDelDia.valor);
    fuente = "xiaomi";
  } else {
    gastoCalorico = bmrCalibrado * profile.factorActividad;
    fuente = "estimado";
  }

  const deficit = deficitDeFase(phaseKey);
  const meta = Math.round(gastoCalorico - deficit);
  return { meta, gastoCalorico: Math.round(gastoCalorico), deficit, fuente, pesoKg: pesoActual };
}
