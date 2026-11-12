"use client";

import { useEffect, useState } from "react";
import { addDays, fromISO, toISO, todayNormalized, WEEKDAY_LABELS } from "@/lib/date";
import { getCurrentWeekNum, getCarbLoadWeeks, type Week } from "@/lib/training-plan";
import { cn } from "@/lib/utils";
import { getMealsForDay, PROTEINA_G_POR_KG, type MealBank } from "@/lib/meal-plan";
import { getCalorieTargetForDate } from "@/app/(app)/nutricion/actions";
import type { CalorieTarget } from "@/lib/calorie-target";
import { WeekSelector } from "@/components/week-selector/week-selector";
import { MealCard } from "@/components/nutrition/meal-card";
import { FixedRules } from "@/components/nutrition/fixed-rules";

function currentDayIdx(today: Date): number {
  const jsDay = today.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function NutricionClient({ weeks, mealBank }: { weeks: Week[]; mealBank?: MealBank }) {
  const today = todayNormalized();
  // el fin de semana no tiene plan: abrir directo en el lunes que viene
  const start = addDays(today, today.getDay() === 6 ? 2 : today.getDay() === 0 ? 1 : 0);

  const [week, setWeek] = useState(() => getCurrentWeekNum(weeks, start));
  const [day, setDay] = useState(() => currentDayIdx(start));
  const [calorieTarget, setCalorieTarget] = useState<CalorieTarget | null>(null);

  const carbLoadWeeks = getCarbLoadWeeks(weeks);
  const dayPlan = getMealsForDay(week, day, carbLoadWeeks, {
    bank: mealBank,
    metaKcal: calorieTarget?.meta,
    pesoKg: calorieTarget?.pesoKg,
  });
  const weekObj = weeks.find((w) => w.num === week) ?? weeks[0];
  const weekStart = fromISO(weekObj.start);

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
        <h1 className="text-4xl font-bold">Nutrición</h1>
        <p className="max-w-prose text-muted-foreground">
          Cuatro comidas de lunes a viernes con el método del plato. El menú rota cada semana.
        </p>
      </div>

      <WeekSelector weeks={weeks} selectedWeek={week} onSelectWeek={handleSelectWeek} />

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setDay(i)}
            aria-pressed={day === i}
            className={cn(
              "rounded-md border py-1.5 text-center text-sm transition-colors",
              day === i
                ? "border-primary bg-primary/15 font-semibold"
                : "border-border text-muted-foreground hover:bg-muted",
              i >= 5 && day !== i && "border-dashed",
            )}
          >
            <span className="block text-xs">{label.slice(0, 3)}</span>
            <span className="font-heading text-lg tabular-nums">
              {addDays(weekStart, i).getDate()}
            </span>
          </button>
        ))}
      </div>

      {dayPlan.isWeekday ? (
        <div className="grid gap-4">
          {dayPlan.meals.map((meal) => (
            <MealCard key={meal.type} meal={meal} factor={dayPlan.factor} />
          ))}
          <div className="grid gap-1 rounded-lg bg-muted/50 px-4 py-3 text-sm font-medium tabular-nums">
            <p>
              Total del día: {dayPlan.totalProteinG.toFixed(1)} g de proteína
              {calorieTarget &&
                ` · objetivo ${Math.round(calorieTarget.pesoKg * PROTEINA_G_POR_KG)} g (${PROTEINA_G_POR_KG} g/kg)`}
            </p>
            {calorieTarget && (
              <p>
                Plan: ~{Math.round(dayPlan.totalKcal)} kcal · Meta calórica (
                {calorieTarget.fuente === "xiaomi" ? "BMR + activas" : "estimado"}):{" "}
                {calorieTarget.meta} kcal
                {dayPlan.factor !== 1 && ` · porciones ×${dayPlan.factor.toFixed(2)}`}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          El fin de semana no tiene menú fijo. Antes de una carrera larga o una caminata, seguí la
          guía de carga de carbohidratos del Calendario.
        </div>
      )}

      <FixedRules />
    </div>
  );
}
