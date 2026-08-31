"use client";

import { NumericLogForm } from "@/components/log-form/numeric-log-form";

export function CalorieForm({
  calorieTarget,
}: {
  calorieTarget?: { meta: number; fuente: string } | null;
}) {
  return (
    <div className="grid gap-4">
      {calorieTarget && (
        <p className="rounded-md bg-accent/15 px-3 py-2 text-sm text-foreground">
          Meta calórica de hoy: {calorieTarget.meta} kcal (
          {calorieTarget.fuente === "xiaomi" ? "BMR + activas" : "estimado"})
        </p>
      )}
      <NumericLogForm
        categoria="calorias"
        fieldLabel="Calorías activas (últimas 24hs)"
        step="1"
        successMessage="Calorías guardadas"
        defaultToYesterday
      />
    </div>
  );
}
