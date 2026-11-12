"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatShort, fromISO } from "@/lib/date";
import { formatPace } from "@/lib/pace";

export interface Punto {
  fecha: string; // ISO YYYY-MM-DD, ascendente
  valor: number;
}

// formatShort y no toLocaleDateString: el ICU de Node dice "sep" y el de Chrome "sept" (hydration)
const fmtFecha = (iso: string) => formatShort(fromISO(iso));

/**
 * Línea de una sola serie en el tiempo (peso o ritmo). SVG estirado al contenedor (sin
 * dependencias) y todo el texto en HTML, para que no se deforme en pantallas angostas. Crosshair +
 * tooltip con mouse, touch y flechas del teclado; la tabla de abajo tiene los mismos datos.
 */
export function LineaTiempo({
  puntos,
  tipo,
  meta,
  nombre,
}: {
  puntos: Punto[];
  /** "ritmo": segundos por km, con el eje invertido (más rápido = más arriba). */
  tipo: "kg" | "ritmo";
  meta?: number | null;
  /** Para lectores de pantalla y el encabezado de la tabla. */
  nombre: string;
}) {
  const [activo, setActivo] = useState<number | null>(null);
  const fmt = (v: number) =>
    tipo === "kg" ? `${v.toLocaleString("es-AR", { maximumFractionDigits: 1 })} kg` : formatPace(v);

  const t = puntos.map((p) => fromISO(p.fecha).getTime());
  const span = t.at(-1)! - t[0] || 1;
  const valores = puntos.map((p) => p.valor);
  // el eje incluye la meta, aunque ningún dato llegue todavía
  const min = Math.min(...valores, meta ?? Infinity);
  const max = Math.max(...valores, meta ?? -Infinity);
  const pad = (max - min) * 0.12 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const x = (i: number) => ((t[i] - t[0]) / span) * 100;
  // % desde arriba
  const y = (v: number) => {
    const f = (v - lo) / (hi - lo);
    return (tipo === "ritmo" ? f : 1 - f) * 100;
  };

  function cercano(clientX: number, el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * 100;
    let mejor = 0;
    for (let i = 1; i < puntos.length; i++)
      if (Math.abs(x(i) - px) < Math.abs(x(mejor) - px)) mejor = i;
    setActivo(mejor);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const ultimo = puntos.length - 1;
    const i = activo ?? ultimo;
    const sig =
      e.key === "ArrowLeft"
        ? Math.max(0, i - 1)
        : e.key === "ArrowRight"
          ? Math.min(ultimo, i + 1)
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? ultimo
              : null;
    if (sig === null) return;
    e.preventDefault();
    setActivo(sig);
  }

  const ultimo = puntos.length - 1;
  const iMin = valores.indexOf(Math.min(...valores));
  const iMax = valores.indexOf(Math.max(...valores));
  const etiquetasY = [...new Set([iMin, iMax])];
  const a = activo === null ? null : puntos[activo];

  return (
    <figure className="grid gap-2">
      <div className="grid grid-cols-[auto_1fr] gap-2">
        {/* eje Y: solo el mínimo y el máximo registrados */}
        <div className="relative h-40 w-14 text-right text-xs text-muted-foreground tabular-nums">
          {etiquetasY.map((i) => (
            <span
              key={i}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: `${y(valores[i])}%` }}
            >
              {fmt(valores[i])}
            </span>
          ))}
        </div>

        <div
          className="relative h-40 touch-pan-y rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          tabIndex={0}
          role="group"
          aria-label={`${nombre}: de ${fmt(valores[0])} el ${fmtFecha(puntos[0].fecha)} a ${fmt(valores[ultimo])} el ${fmtFecha(puntos[ultimo].fecha)}. Usá las flechas para recorrer los valores.`}
          onPointerMove={(e) => cercano(e.clientX, e.currentTarget)}
          onPointerDown={(e) => cercano(e.clientX, e.currentTarget)}
          onPointerLeave={() => setActivo(null)}
          onFocus={() => setActivo(ultimo)}
          onBlur={() => setActivo(null)}
          onKeyDown={onKeyDown}
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
            aria-hidden="true"
          >
            {etiquetasY.map((i) => (
              <line
                key={i}
                x1="0"
                x2="100"
                y1={y(valores[i])}
                y2={y(valores[i])}
                className="stroke-border"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {meta != null && (
              <line
                x1="0"
                x2="100"
                y1={y(meta)}
                y2={y(meta)}
                className="stroke-accent"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            )}
            <polyline
              points={puntos.map((p, i) => `${x(i)},${y(p.valor)}`).join(" ")}
              fill="none"
              className="stroke-primary"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {activo !== null && (
              <line
                x1={x(activo)}
                x2={x(activo)}
                y1="0"
                y2="100"
                className="stroke-muted-foreground"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {meta != null && (
            <span
              className="absolute left-1 -translate-y-full pb-0.5 text-xs text-muted-foreground"
              style={{ top: `${y(meta)}%` }}
            >
              Meta {fmt(meta)}
            </span>
          )}

          {/* punto final siempre, y el punto activo al recorrer */}
          {[activo ?? ultimo].map((i) => (
            <span
              key="dot"
              className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-card"
              style={{ left: `${x(i)}%`, top: `${y(valores[i])}%` }}
            />
          ))}

          <div
            aria-live="polite"
            className={cn(
              "pointer-events-none absolute top-0 grid rounded-md bg-popover px-2 py-1 text-xs whitespace-nowrap shadow-md ring-1 ring-foreground/10",
              a === null && "sr-only",
            )}
            style={
              activo === null
                ? undefined
                : {
                    left: `${x(activo)}%`,
                    transform: `translateX(${x(activo) < 20 ? "4px" : x(activo) > 80 ? "calc(-100% - 4px)" : "-50%"})`,
                  }
            }
          >
            {a && (
              <>
                <strong className="text-sm font-semibold tabular-nums">{fmt(a.valor)}</strong>
                <span className="text-muted-foreground">{fmtFecha(a.fecha)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="ml-16 flex justify-between text-xs text-muted-foreground">
        <span>{fmtFecha(puntos[0].fecha)}</span>
        <span>{fmtFecha(puntos[ultimo].fecha)}</span>
      </div>

      <details className="ml-16 text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Ver datos
        </summary>
        <div className="mt-2 max-h-60 overflow-y-auto">
          <table className="w-full text-left tabular-nums">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-1 font-medium">Fecha</th>
                <th className="py-1 text-right font-medium">{nombre}</th>
              </tr>
            </thead>
            <tbody>
              {[...puntos].reverse().map((p) => (
                <tr key={p.fecha} className="border-t">
                  <td className="py-1">{fmtFecha(p.fecha)}</td>
                  <td className="py-1 text-right">{fmt(p.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
