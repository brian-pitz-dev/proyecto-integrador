"use client";

import { NumericLogForm } from "@/components/log-form/numeric-log-form";

export function WalkForm() {
  return (
    <NumericLogForm
      categoria="caminata"
      fieldLabel="Distancia (km)"
      step="0.01"
      successMessage="Caminata guardada"
    />
  );
}
