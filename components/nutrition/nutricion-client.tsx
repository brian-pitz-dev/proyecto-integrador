"use client";

import { useEffect, useState } from "react";
import { addDays, fromISO, toISO, todayNormalized, WEEKDAY_LABELS } from "@/lib/date";
import { getCurrentWeekNum, type PlanWeek } from "@/lib/training-plan";
import { getMealsForDay } from "@/lib/meal-plan";
import { getCalorieTargetForDate } from "@/app/(app)/nutricion/actions";
import type { CalorieTarget } from "@/lib/calorie-target";
import { WeekSelector } from "@/components/week-selector/week-selector";
import { MealCard } from "@/components/nutrition/meal-card";
import { FixedRules } from "@/components/nutrition/fixed-rules";

function currentDayIdx(today: Date): number {
  const jsDay = today.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function NutricionClient({ weeks }: { weeks: PlanWeek[] }) {
  const today = todayNormalized();
  const todayWeek = getCurrentWeekNum(weeks, today);
  const todayDay = currentDayIdx(today);

  const [week, setWeek] = useState(todayWeek);
  const [day, setDay] = useState(todayDay);
  const [calorieTarget, setCalorieTarget] = useState<CalorieTarget | null>(null);

  const dayPlan = getMealsForDay(week, day);
  const weekObj = weeks.find((w) => w.num === week) ?? weeks[0];
  const weekStart = fromISO(weekObj.start);
  const dayOptions = WEEKDAY_LABELS.map((label, i) => ({
    idx: i,
    label: `${label} ${addDays(weekStart, i).getDate()}`,
  }));

  function handleSelectWeek(weekNum: number) {
    setWeek(weekNum);
    setDay(0); // siempre arranca en lunes al cambiar de semana
  }

  useEffect(() => {
    // En fin de semana no se muestra el total (dayPlan.isWeekday === false), no hace falta pedirlo.
    if (day >= 5) return;
    const weekObj = weeks.find((w) => w.num === week);
    if (!weekObj) return;
    const dateISO = toISO(addDays(fromISO(weekObj.start), day));
    let cancelled = false;
    getCalorieTargetForDate(dateISO).then((target) => {
      if (!cancelled) setCalorieTarget(target);
    });
    return () => {
      cancelled = true;
    };
  }, [week, day, weeks]);

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-5">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nutrición</h1>
        <p className="text-sm text-muted-foreground">
          4 comidas/día · Lunes a Viernes · Método del plato · Rota semana a semana
        </p>
      </div>

      <WeekSelector weeks={weeks} selectedWeek={week} onSelectWeek={handleSelectWeek} />

      <select
        aria-label="Día"
        value={day}
        onChange={(e) => setDay(Number(e.target.value))}
        className="w-fit rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-medium text-foreground"
      >
        {dayOptions.map(({ idx, label }) => (
          <option key={idx} value={idx}>
            {label}
          </option>
        ))}
      </select>

      {dayPlan.isWeekday ? (
        <div className="grid gap-4">
          {dayPlan.meals.map((meal) => (
            <MealCard key={meal.type} meal={meal} />
          ))}
          <div className="grid gap-1 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-foreground">
            <p>Total del día: {dayPlan.totalProteinG.toFixed(1)}g proteína</p>
            {calorieTarget && (
              <p>
                Meta calórica ({calorieTarget.fuente === "xiaomi" ? "BMR + activas" : "estimado"}):{" "}
                {calorieTarget.meta} kcal
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Fin de semana libre — comé lo que quieras/puedas. Excepción: los días de evento (10K,
          Luján, 21K) tienen indicaciones propias en Calendario.
        </div>
      )}

      <FixedRules />
    </div>
  );
}
