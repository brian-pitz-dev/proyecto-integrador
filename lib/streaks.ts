import { getSessionsForDate, TARGET_PACE_SEC } from "@/lib/training-plan";
import { paceStrToSeconds } from "@/lib/pace";
import type { Registro } from "@/lib/types";
import { toISO } from "@/lib/date";

function todayNormalized(): Date {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

/** Portado de plan_vida_2026.html. */
export function getLastNSaturdays(fromDate: Date, n: number): Date[] {
  const result: Date[] = [];
  const d = new Date(fromDate);
  const diff = (d.getDay() - 6 + 7) % 7;
  d.setDate(d.getDate() - diff);
  for (let i = 0; i < n; i++) {
    result.push(new Date(d));
    d.setDate(d.getDate() - 7);
  }
  return result;
}

/**
 * Equivalente a checkGymStreak(): true si se perdieron 3+ sesiones de gym
 * programadas seguidas (mirando hacia atrás desde ayer) sin marcar como
 * completadas.
 */
export function checkGymStreak(completedDates: Set<string>): boolean {
  let missedStreak = 0;
  const d = todayNormalized();
  d.setDate(d.getDate() - 1);
  let checkedDays = 0;
  while (checkedDays < 30) {
    const sessions = getSessionsForDate(d);
    if (sessions.some((s) => s.tag === "gym")) {
      if (!completedDates.has(toISO(d))) {
        missedStreak++;
        if (missedStreak >= 3) return true;
      } else {
        return false;
      }
    }
    d.setDate(d.getDate() - 1);
    checkedDays++;
  }
  return false;
}

/**
 * Equivalente a checkRunAlert(): true si el ritmo de las últimas 2 tiradas de
 * sábado no mejoró respecto al objetivo (TARGET_PACE_SEC).
 */
export function checkRunAlert(runData: Registro[]): boolean {
  const saturdays = getLastNSaturdays(todayNormalized(), 2);
  return saturdays.every((sat) => {
    const dateStr = toISO(sat);
    const entry = runData.find((r) => r.fecha === dateStr);
    if (!entry) return true;
    const paceSec = paceStrToSeconds(entry.nota);
    return paceSec === null || paceSec > TARGET_PACE_SEC;
  });
}
