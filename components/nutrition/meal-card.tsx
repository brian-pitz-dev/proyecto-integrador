import { Card, CardContent } from "@/components/ui/card";
import type { DayMeal } from "@/lib/meal-plan";

export function MealCard({ meal }: { meal: DayMeal }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-32 shrink-0 text-sm font-medium text-muted-foreground">{meal.label}</div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{meal.meal.name}</p>
          <p className="text-sm text-muted-foreground">{meal.meal.detail}</p>
        </div>
        <p className="shrink-0 text-sm font-medium text-primary sm:text-right">
          {meal.proteinG.toFixed(1)}g proteína
        </p>
      </CardContent>
    </Card>
  );
}
