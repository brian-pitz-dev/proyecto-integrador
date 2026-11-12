"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Opciones } from "@/components/ui/select";
import { useLogSubmit } from "@/components/log-form/registro-category-card";
import { formatPace } from "@/lib/pace";
import { toISO, todayNormalized } from "@/lib/date";
import type { UserEvent } from "@/lib/training-plan";

export function EventForm({ events }: { events: UserEvent[] }) {
  const { pending, formRef, submit } = useLogSubmit("Evento guardado");
  const [eventName, setEventName] = useState(events[0]?.nombre ?? "");
  const selectedEvent = events.find((e) => e.nombre === eventName);

  async function handleSubmit(formData: FormData) {
    const km = Number(formData.get("km"));
    const hs = Number(formData.get("hs") || 0);
    const min = Number(formData.get("min") || 0);
    const fecha = String(formData.get("fecha") || toISO(todayNormalized()));

    if (!eventName || !km || (!hs && !min)) {
      toast.error("Completá evento, distancia y tiempo.");
      return;
    }

    const totalSec = hs * 3600 + min * 60;
    const timeLabel = hs > 0 ? `${hs}h ${min}min` : `${min}min`;
    const paceStr = formatPace(totalSec / km);
    const ok = await submit({
      categoria: "evento",
      fecha,
      valor: km,
      nota: `${eventName} · ${timeLabel} · ${paceStr}`,
    });
    if (ok) setEventName(events[0]?.nombre ?? "");
  }

  return (
    <form ref={formRef} action={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="event-name">Evento</Label>
        <Opciones
          id="event-name"
          value={eventName}
          onChange={setEventName}
          items={events.map((e) => ({ value: e.nombre, label: e.nombre }))}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="event-km">Recorrido total (km)</Label>
        <Input id="event-km" name="km" type="number" step="0.01" min="0" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="event-hs">Horas</Label>
          <Input id="event-hs" name="hs" type="number" min="0" step="1" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="event-min">Minutos</Label>
          <Input id="event-min" name="min" type="number" min="0" max="59" step="1" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="event-fecha">Fecha</Label>
        <Input
          key={eventName}
          id="event-fecha"
          name="fecha"
          type="date"
          defaultValue={selectedEvent ? selectedEvent.fecha : toISO(todayNormalized())}
        />
      </div>
      <Button type="submit" disabled={pending}>
        Guardar evento
      </Button>
    </form>
  );
}
