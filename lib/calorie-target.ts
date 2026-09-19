import { createClient } from "@/lib/supabase/server";
import { getPhaseKeyForDate } from "@/lib/training-plan";
import type { Registro } from "@/lib/types";
import { toISO } from "@/lib/date";

/** Portado de plan_vida_2026.html: PERSONAL_DATA / INBODY_REFERENCE / mifflin(). */
const PERSONAL_DATA = {
  edad: 28,
  alturaCm: 180,
  sexo: "M" as "M" | "F",
  factorActividad: 1.55, // moderado — solo se usa si no hay calorías activas cargadas
};

// Calibración con InBody real (18/06/2026): BMR medido 1859 kcal a 94.9kg
const INBODY_REFERENCE = { peso: 94.9, bmrReal: 1859 };

export function mifflin(peso: number): number {
  return PERSONAL_DATA.sexo === "M"
    ? 10 * peso + 6.25 * PERSONAL_DATA.alturaCm - 5 * PERSONAL_DATA.edad + 5
    : 10 * peso + 6.25 * PERSONAL_DATA.alturaCm - 5 * PERSONAL_DATA.edad - 161;
}

const CALIBRATION_FACTOR = INBODY_REFERENCE.bmrReal / mifflin(INBODY_REFERENCE.peso);

/** BMR calibrado con InBody para un peso dado — usado para sumar el gasto total (BMR + activas). */
export function computeBmrCalibrado(peso: number): number {
  return mifflin(peso) * CALIBRATION_FACTOR;
}

const deficitPorFase: Record<string, number> = {
  p1: 400,
  p2: 350,
  p3: 130, // reactivación post-Luján: priorizar recuperación sobre bajar de peso
  p4: 150, // construcción 21K: casi mantenimiento, energía para sostener la carga
  p5: 100, // tapering: casi mantenimiento + carga de carbohidratos
  p6: 550,
};

export interface CalorieTarget {
  meta: number;
  gastoCalorico: number;
  deficit: number;
  fuente: "xiaomi" | "estimado";
}

/** Equivalente a getCalorieTarget() de plan_vida_2026.html. */
export async function getCalorieTarget(dateObj: Date): Promise<CalorieTarget | null> {
  const phaseKey = getPhaseKeyForDate(dateObj);
  const fechaISO = toISO(dateObj);
  const supabase = await createClient();

  const [{ data: calLogs }, { data: pesoLogs }] = await Promise.all([
    supabase
      .from("registro")
      .select("*")
      .eq("categoria", "calorias")
      .order("fecha", { ascending: false })
      .limit(500),
    supabase
      .from("registro")
      .select("*")
      .eq("categoria", "peso")
      .order("fecha", { ascending: false })
      .limit(1),
  ]);

  if (!pesoLogs || pesoLogs.length === 0) return null;

  const pesoActual = Number((pesoLogs[0] as Registro).valor);
  const bmrCalibrado = computeBmrCalibrado(pesoActual);
  const logDelDia = (calLogs as Registro[] | null)?.find((r) => r.fecha === fechaISO);

  let gastoCalorico: number;
  let fuente: CalorieTarget["fuente"];
  if (logDelDia) {
    gastoCalorico = bmrCalibrado + Number(logDelDia.valor);
    fuente = "xiaomi";
  } else {
    gastoCalorico = bmrCalibrado * PERSONAL_DATA.factorActividad;
    fuente = "estimado";
  }

  const deficit = (phaseKey && deficitPorFase[phaseKey]) || 400;
  const meta = Math.round(gastoCalorico - deficit);
  return { meta, gastoCalorico: Math.round(gastoCalorico), deficit, fuente };
}
