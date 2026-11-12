/** Predicción de tiempo de carrera con la fórmula de Riegel, a partir de las corridas registradas. */

import { addDays, toISO } from "@/lib/date";
import { paceStrToSeconds } from "@/lib/pace";
import type { Registro } from "@/lib/types";

export interface Esfuerzo {
  fecha: string;
  km: number;
  seg: number;
}

/** Más lento que esto es caminata, no corrida (mismo corte que el ritmo promedio de Estadísticas). */
const RITMO_MAX_CORRIDA = 10 * 60;
/** Solo cuentan las corridas recientes: reflejan la forma actual. */
const VENTANA_DIAS = 60;

/** Riegel (1981): T2 = T1 · (D2 / D1)^1.06. */
export function riegel(seg: number, km: number, objetivoKm: number): number {
  return seg * Math.pow(objetivoKm / km, 1.06);
}

/** Tiradas y resultados de eventos con distancia y ritmo legibles (el tiempo sale de ritmo × km). */
export function esfuerzosDe(registros: Registro[]): Esfuerzo[] {
  return registros.flatMap((r) => {
    const ritmo = paceStrToSeconds(r.nota);
    const km = Number(r.valor);
    if (!ritmo || !(km > 0) || ritmo >= RITMO_MAX_CORRIDA) return [];
    return [{ fecha: r.fecha, km, seg: ritmo * km }];
  });
}

/**
 * Tiempo estimado para `objetivoKm`: la mejor predicción entre las corridas de los últimos 60 días.
 * shortcut: Riegel pierde precisión al extrapolar mucho, así que solo usa corridas de al menos 3 km
 * y de al menos un cuarto de la distancia objetivo; si hace falta más precisión, sumar el volumen
 * semanal (ej. fórmula de Tanda) cuando haya suficientes registros.
 */
export function predecirCarrera(
  esfuerzos: Esfuerzo[],
  objetivoKm: number,
  hoy: Date,
): { seg: number; base: Esfuerzo } | null {
  const desde = toISO(addDays(hoy, -VENTANA_DIAS));
  const hasta = toISO(hoy);
  let mejor: { seg: number; base: Esfuerzo } | null = null;
  for (const e of esfuerzos) {
    if (e.fecha < desde || e.fecha > hasta || e.km < Math.max(3, objetivoKm / 4)) continue;
    const seg = riegel(e.seg, e.km, objetivoKm);
    if (!mejor || seg < mejor.seg) mejor = { seg, base: e };
  }
  return mejor;
}
