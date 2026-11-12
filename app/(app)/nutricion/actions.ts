"use server";

import { getCalorieTarget, type CalorieTarget } from "@/lib/calorie-target";
import { getUserPlanContext } from "@/lib/user-plan";
import { fromISO } from "@/lib/date";

export async function getCalorieTargetForDate(iso: string): Promise<CalorieTarget | null> {
  // Server Action: llega cualquier cosa desde el navegador
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const planContext = await getUserPlanContext();
  if (!planContext) return null;
  const { profile, weeks } = planContext;
  return getCalorieTarget(fromISO(iso), profile, weeks);
}
