import { Card, CardContent } from "@/components/ui/card";
import { formatPortion, type DayMeal } from "@/lib/meal-plan";

export function MealCard({ meal, factor }: { meal: DayMeal; factor: number }) {
  const portion = factor !== 1 ? formatPortion(meal.meal) : "";

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-28 shrink-0 text-sm font-medium text-muted-foreground">{meal.label}</div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{meal.meal.name}</p>
          <p className="text-sm text-muted-foreground">{meal.meal.detail}</p>
          {portion && (
            <p className="text-sm text-foreground">
              Porción para tu meta: <span className="tabular-nums">{portion}</span>
            </p>
          )}
        </div>
        <p className="shrink-0 text-sm text-muted-foreground tabular-nums sm:text-right">
          {meal.proteinG.toFixed(1)} g proteína
        </p>
      </CardContent>
    </Card>
  );
}
