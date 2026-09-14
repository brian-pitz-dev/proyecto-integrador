"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveLog } from "@/app/registro/actions";
import { useCloseLogEntryDialog } from "@/components/log-form/registro-category-card";
import type { Categoria } from "@/lib/types";
import { toISO, addDays } from "@/lib/date";

interface NumericLogFormProps {
  categoria: Categoria;
  fieldLabel: string;
  step?: string;
  successMessage: string;
  /** true para categorías que registran el total de las últimas 24hs (calorías, sueño): la fecha por defecto es ayer. */
  defaultToYesterday?: boolean;
}

/** Formulario genérico para categorías de un solo valor numérico (caminata, calorías, peso). */
export function NumericLogForm({
  categoria,
  fieldLabel,
  step = "0.1",
  successMessage,
  defaultToYesterday,
}: NumericLogFormProps) {
  const closeDialog = useCloseLogEntryDialog();
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const fieldId = `${categoria}-valor`;
  const dateId = `${categoria}-fecha`;
  const defaultDate = toISO(defaultToYesterday ? addDays(new Date(), -1) : new Date());

  async function handleSubmit(formData: FormData) {
    if (pendingRef.current) return;
    const valor = Number(formData.get("valor"));
    const fecha = String(formData.get("fecha") || defaultDate);

    if (!valor) {
      toast.error(`Completá ${fieldLabel.toLowerCase()}.`);
      return;
    }

    pendingRef.current = true;
    setPending(true);
    const result = await saveLog({ categoria, fecha, valor });
    pendingRef.current = false;
    setPending(false);

    if (result.ok) {
      toast.success(successMessage);
      formRef.current?.reset();
      closeDialog();
    } else {
      toast.error(result.message ?? "No se pudo guardar.");
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor={fieldId}>{fieldLabel}</Label>
        <Input id={fieldId} name="valor" type="number" step={step} min="0" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={dateId}>Fecha</Label>
        <Input id={dateId} name="fecha" type="date" defaultValue={defaultDate} />
      </div>
      <Button type="submit" disabled={pending}>
        Guardar
      </Button>
    </form>
  );
}
