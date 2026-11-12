/** Resumen de logros (Stats) — portado de plan_vida_2026.html: countTrainableVsCompleted, buildMonthHistory, weight progress. */

import { getSessionsForDate, getNextEvent, type Week, type UserEvent } from "@/lib/training-plan";
import { addDays, toISO, fromISO, todayNormalized, MONTHS_ES } from "@/lib/date";
import type { Registro } from "@/lib/types";

export function isTrainableDate(weeks: Week[], events: UserEvent[], date: Date): boolean {
  return getSessionsForDate(weeks, events, date).some((s) => s.tag !== "rest");
}

export function countTrainableVsCompleted(
  weeks: Week[],
  events: UserEvent[],
  planStart: Date,
  from: Date,
  to: Date,
  completedDates: Set<string>,
): { trainable: number; completed: number } {
  let trainable = 0;
  let completed = 0;
  let d = new Date(from);
  while (d <= to) {
    if (d >= planStart && isTrainableDate(weeks, events, d)) {
      trainable++;
      if (completedDates.has(toISO(d))) completed++;
    }
    d = addDays(d, 1);
  }
  return { trainable, completed };
}

export interface MonthHistoryRow {
  label: string;
  completed: number;
  trainable: number;
}

export function buildMonthHistory(
  weeks: Week[],
  events: UserEvent[],
  planStart: Date,
  completedDates: Set<string>,
): MonthHistoryRow[] {
  const rows: MonthHistoryRow[] = [];
  // fecha de Buenos Aires: con new Date() (UTC en el server), el último día del mes después de
  // las 21 h el mes actual aparecía como terminado
  const now = todayNormalized();
  const curMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  let cursor = new Date(planStart.getFullYear(), planStart.getMonth(), 1);

  while (cursor < curMonthStart) {
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const clampedStart = cursor < planStart ? planStart : cursor;
    const clampedEnd = monthEnd;
    if (clampedStart <= clampedEnd) {
      const { trainable, completed } = countTrainableVsCompleted(
        weeks,
        events,
        planStart,
        clampedStart,
        clampedEnd,
        completedDates,
      );
      rows.push({
        label: `${MONTHS_ES[cursor.getMonth()]} ${cursor.getFullYear()}`,
        completed,
        trainable,
      });
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return rows;
}

export function formatSleepHours(decimalHours: number): string {
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  return `${h}:${m.toString().padStart(2, "0")} hs`;
}

export interface WeightProgress {
  start: number;
  current: number;
  target: number;
  pct: number;
  diffLabel: string;
  /** Días hasta el próximo evento del usuario, o null si no tiene ninguno pendiente. */
  daysToNextEvent: number | null;
}

/** Progreso de peso hacia la meta del perfil del usuario (weightData ordenado desc por fecha). */
export function computeWeightProgress(
  weightValuesDesc: number[],
  targetKg: number,
  events: UserEvent[],
  today: Date,
): WeightProgress | null {
  if (weightValuesDesc.length === 0) return null;

  const current = weightValuesDesc[0];
  const start = weightValuesDesc[weightValuesDesc.length - 1];
  const target = targetKg;
  const diffToTarget = current - target;
  const totalToLose = start - target;
  let pct = totalToLose === 0 ? 100 : ((start - current) / totalToLose) * 100;
  pct = Math.max(0, Math.min(100, pct));
  const nextEvent = getNextEvent(events, today);
  const daysToNextEvent = nextEvent
    ? Math.max(0, Math.ceil((fromISO(nextEvent.fecha).getTime() - today.getTime()) / 86_400_000))
    : null;
  const diffLabel =
    Math.abs(diffToTarget) < 0.05
      ? "¡Llegaste al objetivo!"
      : diffToTarget > 0
        ? `Te faltan ${diffToTarget.toFixed(1)} kg para bajar`
        : `Ya bajaste ${Math.abs(diffToTarget).toFixed(1)} kg de más`;

  return { start, current, target, pct, diffLabel, daysToNextEvent };
}

const BA_TIMEZONE = "America/Argentina/Buenos_Aires";

/** Fecha (YYYY-MM-DD) y hora de `now` en horario de Buenos Aires, sin depender del TZ del server. */
function getBuenosAiresParts(now: Date): { fecha: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hourRaw = get("hour");
  // Algunos motores ICU devuelven "24" para medianoche con hour12: false.
  const hour = hourRaw === "24" ? 0 : Number(hourRaw);
  return { fecha: `${get("year")}-${get("month")}-${get("day")}`, hour };
}

/**
 * Portado de plan_vida_2026.html: recordatorio post-10am de datos de ayer sin
 * cargar (sueño/calorías; el peso tiene su propia alerta aparte).
 */
export function getMissingYesterdayItems(
  sueno: Registro[],
  calorias: Registro[],
  now: Date,
): string[] {
  const { fecha: todayBA, hour } = getBuenosAiresParts(now);
  if (hour < 10) return [];

  const yesterdayISO = toISO(addDays(fromISO(todayBA), -1));
  const missing: string[] = [];
  if (!sueno.some((r) => r.fecha === yesterdayISO)) missing.push("sueño de anoche");
  if (!calorias.some((r) => r.fecha === yesterdayISO)) missing.push("calorías de ayer");
  return missing;
}
