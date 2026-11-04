"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogSubmit } from "@/components/log-form/registro-category-card";
import { toISO, addDays, todayNormalized } from "@/lib/date";

export function SleepForm() {
  const { pending, formRef, submit } = useLogSubmit("Sueño guardado");
  const defaultDate = toISO(addDays(todayNormalized(), -1));

  async function handleSubmit(formData: FormData) {
    const hs = Number(formData.get("hs") || 0);
    const min = Number(formData.get("min") || 0);
    const fecha = String(formData.get("fecha") || defaultDate);

    if (!hs && !min) {
      toast.error("Completá horas o minutos de sueño.");
      return;
    }

    const total = Number((hs + min / 60).toFixed(2));
    await submit({ categoria: "sueno", fecha, valor: total });
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
