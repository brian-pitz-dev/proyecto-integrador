"use client";

import { NumericLogForm } from "@/components/log-form/numeric-log-form";

export function WeightForm() {
  return (
    <NumericLogForm
      categoria="peso"
      fieldLabel="Peso (kg)"
      step="0.1"
      successMessage="Peso guardado"
    />
  );
}
