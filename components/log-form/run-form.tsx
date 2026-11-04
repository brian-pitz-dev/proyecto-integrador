"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogSubmit } from "@/components/log-form/registro-category-card";
import { formatPace } from "@/lib/pace";
import { toISO, todayNormalized } from "@/lib/date";

export function RunForm() {
  const { pending, formRef, submit } = useLogSubmit("Tirada guardada");

  async function handleSubmit(formData: FormData) {
    const km = Number(formData.get("km"));
    const hs = Number(formData.get("hs") || 0);
    const min = Number(formData.get("min") || 0);
    const fecha = String(formData.get("fecha") || toISO(todayNormalized()));

    if (!km || (!hs && !min)) {
      toast.error("Completá distancia y tiempo.");
      return;
    }

    const totalSec = hs * 3600 + min * 60;
    const timeLabel = hs > 0 ? `${hs}h ${min}min` : `${min}min`;
    const paceStr = formatPace(totalSec / km);
    await submit({ categoria: "tirada", fecha, valor: km, nota: `${timeLabel} · ${paceStr}` });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="run-km">Distancia (km)</Label>
        <Input id="run-km" name="km" type="number" step="0.01" min="0" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="run-hs">Horas</Label>
          <Input id="run-hs" name="hs" type="number" min="0" step="1" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="run-min">Minutos</Label>
          <Input id="run-min" name="min" type="number" min="0" max="59" step="1" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="run-fecha">Fecha</Label>
        <Input id="run-fecha" name="fecha" type="date" defaultValue={toISO(todayNormalized())} />
      </div>
      <Button type="submit" disabled={pending}>
        Guardar tirada
      </Button>
    </form>
  );
}
