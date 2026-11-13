import Link from "next/link";
import { Flag, Footprints, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fromISO, todayNormalized } from "@/lib/date";
import { formatPace } from "@/lib/pace";
import type { UserEvent } from "@/lib/training-plan";

const DAY_MS = 24 * 60 * 60 * 1000;

function cuando(fecha: string): { texto: string; pasado: boolean } {
  const dias = Math.round((fromISO(fecha).getTime() - todayNormalized().getTime()) / DAY_MS);
  if (dias < 0) return { texto: "Hecho", pasado: true };
  if (dias === 0) return { texto: "¡Es hoy!", pasado: false };
  if (dias === 1) return { texto: "Mañana", pasado: false };
  if (dias < 14) return { texto: `En ${dias} días`, pasado: false };
  return { texto: `En ${Math.round(dias / 7)} semanas`, pasado: false };
}

/**
 * Los eventos del usuario arriba del Calendario: para qué está entrenando y cuánto falta. Sin
 * ninguno por delante, invita a cargar el próximo (el plan queda en mantenimiento hasta entonces).
 */
export function EventosResumen({ events }: { events: UserEvent[] }) {
  const ordenados = [...events].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const proximo = ordenados.find((e) => !cuando(e.fecha).pasado);

  return (
    <section aria-labelledby="tus-eventos" className="mx-auto grid w-full max-w-4xl gap-3">
      <h2 id="tus-eventos" className="text-xl font-semibold">
        Tus eventos
      </h2>
      {!proximo && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary/10 p-4 ring-1 ring-primary/50">
          <div className="grid gap-1">
            <p className="flex items-center gap-2 font-semibold">
              <Flag className="size-4 text-primary" aria-hidden="true" />
              {events.length ? "¡Terminaste tus eventos!" : "No tenés eventos cargados"}
            </p>
            <p className="text-sm text-muted-foreground">
              Hasta que cargues el próximo, el plan sigue en mantenimiento. Con un objetivo nuevo
              arma otra preparación hacia esa fecha.
            </p>
          </div>
          <Link href="/perfil" className={buttonVariants()}>
            Agregar mi próximo evento
          </Link>
        </div>
      )}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ordenados.map((ev) => {
          const { texto, pasado } = cuando(ev.fecha);
          const Icon = ev.tipo === "carrera" ? Medal : Footprints;
          return (
            <li
              key={ev.id}
              className={cn(
                "grid gap-1 rounded-xl p-4 ring-1",
                ev === proximo ? "bg-primary/10 ring-primary/50" : "ring-foreground/10",
                pasado && "opacity-60",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Icon className="size-4" aria-hidden="true" />
                  {ev.tipo === "carrera" ? "Carrera" : "Caminata"}
                </span>
                <Badge variant={ev === proximo ? "default" : "outline"}>{texto}</Badge>
              </div>
              <p className="font-heading text-lg font-semibold">{ev.nombre}</p>
              <p className="text-sm text-muted-foreground">
                {fromISO(ev.fecha).toLocaleDateString("es-AR", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}{" "}
                · {ev.distanciaKm} km
                {ev.ritmoObjetivoSeg ? ` · ${formatPace(ev.ritmoObjetivoSeg)}` : ""}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
