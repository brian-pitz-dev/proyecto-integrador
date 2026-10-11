import { getSessionsForDate } from "@/lib/training-plan";
import { toISO, todayNormalized } from "@/lib/date";

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
