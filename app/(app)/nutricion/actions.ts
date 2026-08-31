"use server";

import { getCalorieTarget, type CalorieTarget } from "@/lib/calorie-target";

export async function getCalorieTargetForDate(iso: string): Promise<CalorieTarget | null> {
  return getCalorieTarget(new Date(`${iso}T00:00:00`));
}
