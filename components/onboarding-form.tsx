"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { completeOnboarding } from "@/app/onboarding/actions";
import { toISO, todayNormalized } from "@/lib/date";

interface EventoDraft {
  tipo: "carrera" | "caminata";
  nombre: string;
  fecha: string;
  distanciaKm: string;
}

function emptyEvento(): EventoDraft {
  return { tipo: "carrera", nombre: "", fecha: toISO(todayNormalized()), distanciaKm: "" };
}

export function OnboardingForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [eventos, setEventos] = useState<EventoDraft[]>([emptyEvento()]);

  function updateEvento(i: number, patch: Partial<EventoDraft>) {
    setEventos((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }

  function removeEvento(i: number) {
    setEventos((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const num = (name: string) => {
      const v = formData.get(name);
      return v ? Number(v) : undefined;
    };

    const eventosPayload = eventos
      .filter((e) => e.nombre.trim() && e.fecha && e.distanciaKm)
      .map((e) => ({
        tipo: e.tipo,
        nombre: e.nombre.trim(),
        fecha: e.fecha,
        distanciaKm: Number(e.distanciaKm),
      }));

    if (eventosPayload.length === 0) {
      toast.error("Agregá al menos un evento (carrera o caminata) con nombre, fecha y distancia.");
      return;
    }

    setPending(true);
    const result = await completeOnboarding({
      edad: num("edad") ?? 0,
      alturaCm: num("alturaCm") ?? 0,
      sexo: String(formData.get("sexo")) as "M" | "F",
      pesoInicialKg: num("pesoInicialKg") ?? 0,
      factorActividad: num("factorActividad") ?? 1.55,
      metaPesoKg: num("metaPesoKg") ?? null,
      metaGrasaPct: (formData.get("metaGrasaPct") as string) || null,
      calibracionPesoKg: num("calibracionPesoKg") ?? null,
      calibracionBmrKcal: num("calibracionBmrKcal") ?? null,
      eventos: eventosPayload,
    });
    setPending(false);

    if (result.ok) {
      toast.success("¡Listo! Armamos tu plan.");
      router.push("/calendario");
      router.refresh();
    } else {
      toast.error(result.message ?? "No se pudo completar el registro.");
    }
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Contanos sobre vos</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="edad">Edad</Label>
              <Input id="edad" name="edad" type="number" min="10" max="100" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="alturaCm">Altura (cm)</Label>
              <Input id="alturaCm" name="alturaCm" type="number" min="100" max="250" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sexo">Sexo</Label>
              <select
                id="sexo"
                name="sexo"
                required
                defaultValue="M"
                className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-medium text-foreground"
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pesoInicialKg">Peso actual (kg)</Label>
              <Input
                id="pesoInicialKg"
                name="pesoInicialKg"
                type="number"
                step="0.1"
                min="30"
                max="300"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="factorActividad">Factor de actividad</Label>
              <Input
                id="factorActividad"
                name="factorActividad"
                type="number"
                step="0.05"
                min="1"
                max="2.5"
                defaultValue="1.55"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="metaPesoKg">Meta de peso (kg, opcional)</Label>
              <Input
                id="metaPesoKg"
                name="metaPesoKg"
                type="number"
                step="0.1"
                min="30"
                max="300"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="metaGrasaPct">Meta de % de grasa (opcional)</Label>
              <Input id="metaGrasaPct" name="metaGrasaPct" type="text" placeholder="ej. 14-15%" />
            </div>
          </div>

          <details className="rounded-lg border border-border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              Calibración personal (opcional — ej. medición InBody)
            </summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="calibracionPesoKg">Peso en la medición (kg)</Label>
                <Input
                  id="calibracionPesoKg"
                  name="calibracionPesoKg"
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="calibracionBmrKcal">BMR medido (kcal)</Label>
                <Input
                  id="calibracionBmrKcal"
                  name="calibracionBmrKcal"
                  type="number"
                  min="500"
                  max="6000"
                />
              </div>
            </div>
          </details>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Label>Tus eventos</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEventos((prev) => [...prev, emptyEvento()])}
              >
                <Plus className="size-4" aria-hidden="true" /> Agregar evento
              </Button>
            </div>

            {eventos.map((ev, i) => (
              <div
                key={i}
                className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-5"
              >
                <div className="grid gap-1.5">
                  <Label htmlFor={`tipo-${i}`}>Tipo</Label>
                  <select
                    id={`tipo-${i}`}
                    value={ev.tipo}
                    onChange={(e) =>
                      updateEvento(i, { tipo: e.target.value as "carrera" | "caminata" })
                    }
                    className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-medium text-foreground"
                  >
                    <option value="carrera">Carrera</option>
                    <option value="caminata">Caminata</option>
                  </select>
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor={`nombre-${i}`}>Nombre</Label>
                  <Input
                    id={`nombre-${i}`}
                    value={ev.nombre}
                    onChange={(e) => updateEvento(i, { nombre: e.target.value })}
                    placeholder="ej. 10K del club"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`fecha-${i}`}>Fecha</Label>
                  <Input
                    id={`fecha-${i}`}
                    type="date"
                    value={ev.fecha}
                    onChange={(e) => updateEvento(i, { fecha: e.target.value })}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="grid flex-1 gap-1.5">
                    <Label htmlFor={`km-${i}`}>Distancia (km)</Label>
                    <Input
                      id={`km-${i}`}
                      type="number"
                      step="0.1"
                      min="0"
                      value={ev.distanciaKm}
                      onChange={(e) => updateEvento(i, { distanciaKm: e.target.value })}
                    />
                  </div>
                  {eventos.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Quitar evento"
                      onClick={() => removeEvento(i)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" disabled={pending} size="lg">
            {pending ? "Guardando…" : "Armar mi plan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
