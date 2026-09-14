"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveLog } from "@/app/registro/actions";
import { useCloseLogEntryDialog } from "@/components/log-form/registro-category-card";
import { formatPace, parseTimeToSeconds } from "@/lib/pace";
import { toISO } from "@/lib/date";

export function RunForm() {
  const closeDialog = useCloseLogEntryDialog();
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    if (pendingRef.current) return;
    const km = Number(formData.get("km"));
    const timeStr = String(formData.get("tiempo") ?? "").trim();
    const fecha = String(formData.get("fecha") || toISO(new Date()));

    if (!km || !timeStr) {
      toast.error("Completá distancia y tiempo.");
      return;
    }

    const totalSec = parseTimeToSeconds(timeStr);
    if (Number.isNaN(totalSec)) {
      toast.error("Formato de tiempo inválido. Usá mm:ss o hh:mm:ss");
      return;
    }

    const paceStr = formatPace(totalSec / km);
    pendingRef.current = true;
    setPending(true);
    const result = await saveLog({
      categoria: "tirada",
      fecha,
      valor: km,
      nota: `${timeStr} · ${paceStr}`,
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
      <div className="grid gap-2">
        <Label htmlFor="run-tiempo">Tiempo (mm:ss o hh:mm:ss)</Label>
        <Input id="run-tiempo" name="tiempo" placeholder="Ej: 1:15:30" required />
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
