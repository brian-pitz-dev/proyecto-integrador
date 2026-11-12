"use client";

import { useState } from "react";
import {
  CalendarDays,
  ChartColumn,
  CircleHelp,
  Flame,
  Rocket,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { marcarTutorialVisto } from "@/app/(app)/tutorial-actions";

interface Paso {
  Icon: LucideIcon;
  titulo: string;
  texto: string[];
}

function pasos(nombre: string | null): Paso[] {
  return [
    {
      Icon: Flame,
      titulo: nombre ? `¡Hola, ${nombre}! Bienvenido/a a Bakata` : "¡Bienvenido/a a Bakata!",
      texto: [
        "Bakata arma tu plan de entrenamiento y de comidas a partir de tu perfil y de los eventos para los que te estás preparando.",
        "En un minuto te mostramos qué hay en cada pantalla.",
      ],
    },
    {
      Icon: CalendarDays,
      titulo: "Calendario",
      texto: [
        "Arriba ves tus eventos y cuánto falta para cada uno.",
        "En «Hoy» está lo que te toca. Cuando lo hagas, tocá el círculo para marcarlo como completado.",
        "Con los botones + Peso, + Sueño y + Calorías registrás tus datos del día.",
        "Más abajo recorrés las semanas del plan y, en los días de gym, desplegás la lista de ejercicios.",
      ],
    },
    {
      Icon: UtensilsCrossed,
      titulo: "Nutrición",
      texto: [
        "Las comidas de lunes a viernes, rotando cada semana.",
        "Las porciones se ajustan a tu meta de calorías del día y te mostramos cuánta proteína suma cada comida.",
        "Para que se ajusten, registrá tu peso.",
      ],
    },
    {
      Icon: ChartColumn,
      titulo: "Estadísticas",
      texto: [
        "Tu progreso: peso contra tu objetivo, sueño, calorías, tiradas, caminatas, resultados de tus eventos y días entrenados por mes.",
        "Se completa sola a medida que registrás datos.",
      ],
    },
    {
      Icon: Sparkles,
      titulo: "Coach",
      texto: [
        "Un asistente con IA que conoce tu plan: preguntale lo que quieras sobre entrenamiento, comidas o descanso.",
        "También te arma un plan de comidas con lo que tenés en casa y rutinas de gym a tu medida.",
        "Tenés 20 consultas por día.",
      ],
    },
    {
      Icon: Rocket,
      titulo: "¡Listo para arrancar!",
      texto: [
        "Primer paso: registrá tu peso de hoy desde el Calendario.",
        "Podés volver a ver esta guía cuando quieras con el botón ? de arriba.",
      ],
    },
  ];
}

/** Tutorial de bienvenida: se abre solo la primera vez y se puede reabrir desde el header. */
export function Tutorial({
  abrirAlEntrar,
  nombre,
}: {
  abrirAlEntrar: boolean;
  nombre: string | null;
}) {
  const [open, setOpen] = useState(abrirAlEntrar);
  const [paso, setPaso] = useState(0);
  const lista = pasos(nombre);
  const { Icon, titulo, texto } = lista[paso];
  const ultimo = paso === lista.length - 1;

  function cerrar() {
    setOpen(false);
    // al cerrarlo (salteado o terminado) no se vuelve a abrir solo
    if (abrirAlEntrar) void marcarTutorialVisto();
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Ver la guía de la app"
        onClick={() => {
          setPaso(0);
          setOpen(true);
        }}
      >
        <CircleHelp className="size-4" aria-hidden="true" />
      </Button>

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : cerrar())}>
        <DialogContent className="gap-5 sm:max-w-md">
          <div className="grid size-12 place-items-center rounded-xl bg-primary/15 text-primary">
            <Icon className="size-6" aria-hidden="true" />
          </div>
          <div className="grid gap-2">
            <DialogTitle className="font-heading text-xl font-semibold">{titulo}</DialogTitle>
            <DialogDescription
              render={<div />}
              className="grid gap-2 text-sm text-muted-foreground"
            >
              {texto.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </DialogDescription>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1.5" aria-label={`Paso ${paso + 1} de ${lista.length}`}>
              {lista.map((p, i) => (
                <span
                  key={p.titulo}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === paso ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30",
                  )}
                  aria-hidden="true"
                />
              ))}
            </div>
            <div className="flex gap-2">
              {paso === 0 ? (
                <Button variant="ghost" onClick={cerrar}>
                  Saltear
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setPaso(paso - 1)}>
                  Atrás
                </Button>
              )}
              <Button onClick={() => (ultimo ? cerrar() : setPaso(paso + 1))}>
                {ultimo ? "Empezar" : "Siguiente"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
