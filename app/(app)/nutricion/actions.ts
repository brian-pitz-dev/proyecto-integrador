"use server";

import { getCalorieTarget, type CalorieTarget } from "@/lib/calorie-target";
import { getUserPlanContext } from "@/lib/user-plan";

export async function getCalorieTargetForDate(iso: string): Promise<CalorieTarget | null> {
  const planContext = await getUserPlanContext();
  if (!planContext) return null;
  const { profile, weeks } = planContext;
  return getCalorieTarget(new Date(`${iso}T00:00:00`), profile, weeks);
}
