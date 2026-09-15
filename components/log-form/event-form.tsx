"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveLog } from "@/app/registro/actions";
import { useCloseLogEntryDialog } from "@/components/log-form/registro-category-card";
import { formatPace } from "@/lib/pace";
import { toISO } from "@/lib/date";
import { getEvents } from "@/lib/training-plan";

const EVENTS = getEvents();

export function EventForm() {
  const closeDialog = useCloseLogEntryDialog();
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [eventName, setEventName] = useState(EVENTS[0]?.name ?? "");
  const selectedEvent = EVENTS.find((e) => e.name === eventName);

  async function handleSubmit(formData: FormData) {
    if (pendingRef.current) return;
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
    pendingRef.current = true;
    setPending(true);
    const result = await saveLog({
      categoria: "evento",
      fecha,
      valor: km,
      nota: `${eventName} · ${timeLabel} · ${paceStr}`,
    });
    pendingRef.current = false;
    setPending(false);

    if (result.ok) {
      toast.success("Evento guardado");
      formRef.current?.reset();
      setEventName(EVENTS[0]?.name ?? "");
      closeDialog();
    } else {
      toast.error(result.message ?? "No se pudo guardar.");
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="event-name">Evento</Label>
        <SelectPrimitive.Root
          value={eventName}
          onValueChange={(value) => setEventName(value as string)}
        >
          <SelectPrimitive.Trigger
            id="event-name"
            type="button"
            className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-medium text-foreground"
          >
            <SelectPrimitive.Value />
            <SelectPrimitive.Icon>
              <ChevronDown className="size-4 opacity-60" aria-hidden="true" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>

          <SelectPrimitive.Portal>
            <SelectPrimitive.Positioner sideOffset={4} className="z-50">
              <SelectPrimitive.Popup className="rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
                <SelectPrimitive.List>
                  {EVENTS.map((e) => (
                    <SelectPrimitive.Item
                      key={e.name}
                      value={e.name}
                      className="cursor-default rounded-sm px-2.5 py-1.5 text-sm font-medium text-muted-foreground outline-none data-highlighted:bg-accent/20 data-selected:bg-primary data-selected:text-primary-foreground"
                    >
                      <SelectPrimitive.ItemText>{e.name}</SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  ))}
                </SelectPrimitive.List>
              </SelectPrimitive.Popup>
            </SelectPrimitive.Positioner>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
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
