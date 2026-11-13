"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Unplug } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { desconectarStrava, importarStrava } from "@/app/(app)/estadisticas/actions";

const AVISOS: Record<string, { texto: string; error: boolean }> = {
  conectado: { texto: "Strava conectado. Ya podés importar tus corridas.", error: false },
  cancelado: { texto: "No se conectó: cancelaste en Strava.", error: true },
  permiso: {
    texto:
      "Para importar hace falta el permiso de ver tus actividades. Probá de nuevo y dejalo tildado.",
    error: true,
  },
  error: { texto: "No se pudo conectar con Strava. Probá de nuevo.", error: true },
};

/**
 * Conectar Strava e importar corridas y caminatas (specs/010-strava). `aviso` viene de
 * ?strava= cuando vuelve del OAuth.
 */
export function StravaCard({ conectado, aviso }: { conectado: boolean; aviso?: string }) {
  const [importando, setImportando] = useState(false);
  const [desconectando, setDesconectando] = useState(false);
  const mensaje = aviso ? AVISOS[aviso] : undefined;

  async function correr(
    accion: () => Promise<{ ok: boolean; message?: string }>,
    setCargando: (v: boolean) => void,
  ) {
    setCargando(true);
    const result = await accion().catch(() => ({
      ok: false,
      message: "No se pudo conectar, probá de nuevo.",
    }));
    setCargando(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  }

  return (
    <div id="strava" className="grid gap-3 rounded-xl p-4 ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-0.5">
          <p className="font-semibold">Strava</p>
          <p className="text-sm text-muted-foreground">
            {conectado
              ? "Traé tus corridas y caminatas nuevas a tus registros."
              : "Conectá tu cuenta para importar corridas y caminatas sin cargarlas a mano."}
          </p>
        </div>
        {conectado ? (
          <div className="flex flex-wrap gap-2">
            <Button
              loading={importando}
              disabled={desconectando}
              onClick={() => correr(importarStrava, setImportando)}
            >
              <Download aria-hidden="true" /> {importando ? "Importando…" : "Importar de Strava"}
            </Button>
            <Button
              variant="outline"
              loading={desconectando}
              disabled={importando}
              onClick={() => correr(desconectarStrava, setDesconectando)}
            >
              <Unplug aria-hidden="true" /> Desconectar
            </Button>
          </div>
        ) : (
          // <a> y no <Link>: es un route handler que redirige a Strava, no una página para prefetchear
          <a href="/strava/conectar" className={buttonVariants()}>
            Conectar con Strava
          </a>
        )}
      </div>
      {mensaje && (
        <p
          role={mensaje.error ? "alert" : "status"}
          className={mensaje.error ? "text-sm text-destructive" : "text-sm text-accent"}
        >
          {mensaje.texto}
        </p>
      )}
      {conectado && (
        <p className="text-xs text-muted-foreground">
          La primera vez trae lo de los últimos 30 días; después, solo lo nuevo. Si ya habías
          cargado una corrida a mano, va a quedar repetida: borrá una de las dos.
        </p>
      )}
    </div>
  );
}
