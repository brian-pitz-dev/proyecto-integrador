"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveLog } from "@/app/registro/actions";
import { useCloseLogEntryDialog } from "@/components/log-form/registro-category-card";
import { formatPace } from "@/lib/pace";
import { toISO } from "@/lib/date";

export function RunForm() {
  const closeDialog = useCloseLogEntryDialog();
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    if (pendingRef.current) return;
    const km = Number(formData.get("km"));
    const hs = Number(formData.get("hs") || 0);
    const min = Number(formData.get("min") || 0);
    const fecha = String(formData.get("fecha") || toISO(new Date()));

    if (!km || (!hs && !min)) {
      toast.error("Completá distancia y tiempo.");
      return;
    }

    const totalSec = hs * 3600 + min * 60;
    const timeLabel = hs > 0 ? `${hs}h ${min}min` : `${min}min`;
    const paceStr = formatPace(totalSec / km);
    pendingRef.current = true;
    setPending(true);
    const result = await saveLog({
      categoria: "tirada",
      fecha,
      valor: km,
      nota: `${timeLabel} · ${paceStr}`,
    });
    pendingRef.current = false;
    setPending(false);

    if (result.ok) {
      toast.success("Tirada guardada");
      formRef.current?.reset();
      closeDialog();
    } else {
      toast.error(result.message ?? "No se pudo guardar.");
    }
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
        <Input id="run-fecha" name="fecha" type="date" defaultValue={toISO(new Date())} />
      </div>
      <Button type="submit" disabled={pending}>
        Guardar tirada
      </Button>
    </form>
  );
}
