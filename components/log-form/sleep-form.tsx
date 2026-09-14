"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveLog } from "@/app/registro/actions";
import { useCloseLogEntryDialog } from "@/components/log-form/registro-category-card";
import { toISO, addDays } from "@/lib/date";

export function SleepForm() {
  const closeDialog = useCloseLogEntryDialog();
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const defaultDate = toISO(addDays(new Date(), -1));

  async function handleSubmit(formData: FormData) {
    if (pendingRef.current) return;
    const hs = Number(formData.get("hs") || 0);
    const min = Number(formData.get("min") || 0);
    const fecha = String(formData.get("fecha") || defaultDate);

    if (!hs && !min) {
      toast.error("Completá horas o minutos de sueño.");
      return;
    }

    const total = Number((hs + min / 60).toFixed(2));
    pendingRef.current = true;
    setPending(true);
    const result = await saveLog({ categoria: "sueno", fecha, valor: total });
    pendingRef.current = false;
    setPending(false);

    if (result.ok) {
      toast.success("Sueño guardado");
      formRef.current?.reset();
      closeDialog();
    } else {
      toast.error(result.message ?? "No se pudo guardar.");
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="sleep-hs">Horas</Label>
          <Input id="sleep-hs" name="hs" type="number" min="0" step="1" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sleep-min">Minutos</Label>
          <Input id="sleep-min" name="min" type="number" min="0" max="59" step="1" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="sleep-fecha">Fecha</Label>
        <Input id="sleep-fecha" name="fecha" type="date" defaultValue={defaultDate} />
      </div>
      <Button type="submit" disabled={pending}>
        Guardar
      </Button>
    </form>
  );
}
