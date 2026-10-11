"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogSubmit } from "@/components/log-form/registro-category-card";
import { formatPace } from "@/lib/pace";
import { toISO } from "@/lib/date";
import { getEvents } from "@/lib/training-plan";

const EVENTS = getEvents();

export function EventForm() {
  const { pending, formRef, submit } = useLogSubmit("Evento guardado");
  const [eventName, setEventName] = useState(EVENTS[0]?.name ?? "");
  const selectedEvent = EVENTS.find((e) => e.name === eventName);

  async function handleSubmit(formData: FormData) {
    const km = Number(formData.get("km"));
    const hs = Number(formData.get("hs") || 0);
    const min = Number(formData.get("min") || 0);
    const fecha = String(formData.get("fecha") || toISO(new Date()));

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
    if (ok) setEventName(EVENTS[0]?.name ?? "");
  }

  return (
    <form ref={formRef} action={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="event-name">Evento</Label>
        <select
          id="event-name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-medium text-foreground"
        >
          {EVENTS.map((e) => (
            <option key={e.name} value={e.name}>
              {e.name}
            </option>
          ))}
        </select>
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
          defaultValue={selectedEvent ? toISO(selectedEvent.date) : toISO(new Date())}
        />
      </div>
      <Button type="submit" disabled={pending}>
        Guardar evento
      </Button>
    </form>
  );
}
