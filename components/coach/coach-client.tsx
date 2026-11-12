"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ZONAS } from "@/lib/validation/coach";
import {
  borrarPlanIa,
  chatCoach,
  generarPlanComidas,
  generarRutinas,
} from "@/app/(app)/coach/actions";

type Msg = { role: "user" | "model"; text: string };
type Busy = null | "chat" | "agregar" | "reemplazar" | "rutinas" | "borrar";

const TEXTAREA =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

export function CoachClient({
  usosHoy,
  limite,
  tieneComidas,
  tieneRutinas,
  comidasDesactualizadas,
  rutinasDesactualizadas,
}: {
  usosHoy: number;
  limite: number;
  tieneComidas: boolean;
  tieneRutinas: boolean;
  comidasDesactualizadas: boolean;
  rutinasDesactualizadas: boolean;
}) {
  const router = useRouter();
  const [usados, setUsados] = useState(usosHoy);
  const [busy, setBusy] = useState<Busy>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [comidasTexto, setComidasTexto] = useState("");
  const [equipo, setEquipo] = useState("");
  const [zonas, setZonas] = useState<string[]>([]);

  const restantes = Math.max(0, limite - usados);
  const sinCuota = restantes === 0;

  async function run<T extends { ok: boolean; message?: string }>(
    kind: Exclude<Busy, null>,
    action: () => Promise<T>,
  ): Promise<T | null> {
    setBusy(kind);
    try {
      const result = await action();
      if (!result.ok) toast.error(result.message ?? "Algo salió mal.");
      else if (kind !== "borrar") setUsados((u) => u + 1);
      return result.ok ? result : null;
    } catch {
      toast.error("No se pudo conectar, probá de nuevo.");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    // El historial vive solo en el navegador; se mandan los últimos mensajes como contexto.
    const next = [...messages, { role: "user" as const, text }];
    setMessages(next);
    setDraft("");
    const result = await run("chat", () => chatCoach(next.slice(-12)));
    if (result?.reply) setMessages([...next, { role: "model", text: result.reply }]);
    else setMessages(messages); // si falló, se saca el mensaje para poder reintentar
    if (!result) setDraft(text);
  }

  async function handleComidas(modo: "agregar" | "reemplazar") {
    const result = await run(modo, () => generarPlanComidas({ texto: comidasTexto, modo }));
    if (!result) return;
    toast.success(
      modo === "agregar"
        ? `Sumamos ${result.agregados ?? 0} platos a tu rotación. Van a ir apareciendo en Nutrición.`
        : "Listo, armamos tu plan de comidas nuevo. Miralo en Nutrición.",
    );
    setComidasTexto("");
    router.refresh();
  }

  async function handleRutinas() {
    const result = await run("rutinas", () => generarRutinas({ equipo, zonas }));
    if (!result) return;
    toast.success("Rutinas listas. Las vas a ver en los días de gym del Calendario.");
    router.refresh();
  }

  async function handleBorrar(tipo: "comidas" | "ejercicios") {
    const result = await run("borrar", () => borrarPlanIa(tipo));
    if (!result) return;
    toast.success("Volviste al plan base.");
    router.refresh();
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
      <div>
        <h1 className="text-4xl font-bold">Coach</h1>
        <p className="max-w-prose text-muted-foreground">
          Preguntale sobre tu plan, tus comidas o tus entrenamientos. Conoce tu perfil, tus eventos
          y la fase en la que estás.
        </p>
        <p className="mt-1 text-sm font-medium tabular-nums" aria-live="polite">
          Te quedan {restantes}/{limite} consultas hoy.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4">
          <div className="grid max-h-[28rem] gap-3 overflow-y-auto" aria-live="polite">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ej: &quot;¿Qué me toca esta semana y por qué?&quot;, &quot;Dormí mal, ¿hago igual la
                tirada?&quot;, &quot;¿Qué como antes de la carrera?&quot;
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "justify-self-end bg-primary text-primary-foreground"
                    : "justify-self-start bg-muted text-foreground",
                )}
              >
                {m.text}
              </div>
            ))}
            {busy === "chat" && <p className="text-sm text-muted-foreground">Pensando…</p>}
          </div>
          <form className="flex gap-2" onSubmit={handleSend}>
            <Label htmlFor="coach-msg" className="sr-only">
              Mensaje para el coach
            </Label>
            <Input
              id="coach-msg"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={1000}
              placeholder={sinCuota ? "Sin consultas por hoy" : "Escribí tu consulta…"}
              disabled={!!busy || sinCuota}
              autoComplete="off"
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Enviar"
              disabled={!!busy || sinCuota || !draft.trim()}
            >
              <Send aria-hidden="true" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Plan de comidas con IA</CardTitle>
            <CardDescription>
              Contá qué ingredientes o comidas tenés o querés comer. Podés sumarlos a tu rotación o
              armar un plan nuevo desde cero. Las porciones se ajustan solas a tu meta calórica.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {comidasDesactualizadas && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Tus eventos o tu perfil cambiaron desde que generaste este plan. Conviene rearmarlo.
              </p>
            )}
            <Label htmlFor="comidas-texto">Ingredientes o comidas</Label>
            <textarea
              id="comidas-texto"
              rows={4}
              maxLength={1000}
              value={comidasTexto}
              onChange={(e) => setComidasTexto(e.target.value)}
              placeholder="Ej: tengo lentejas, atún, batata y huevos; me gustan las tartas; no como pescado"
              className={TEXTAREA}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleComidas("agregar")}
                disabled={!!busy || sinCuota || comidasTexto.trim().length < 3}
              >
                {busy === "agregar" ? "Agregando…" : "Agregar al plan"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleComidas("reemplazar")}
                disabled={!!busy || sinCuota || comidasTexto.trim().length < 3}
              >
                {busy === "reemplazar" ? "Armando…" : "Armar plan nuevo"}
              </Button>
              {tieneComidas && (
                <Button variant="ghost" onClick={() => handleBorrar("comidas")} disabled={!!busy}>
                  Volver al plan base
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rutinas de gym con IA</CardTitle>
            <CardDescription>
              Arma tus 7 rutinas de gym según tus eventos, tus metas, las zonas que quieras
              priorizar y el equipo que tengas. El plan sigue decidiendo qué rutina toca cada día.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {rutinasDesactualizadas && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Tus eventos o tu perfil cambiaron desde que generaste estas rutinas. Conviene
                rearmarlas.
              </p>
            )}
            <fieldset className="grid gap-2">
              <legend className="mb-1 text-sm font-medium">Zonas a priorizar</legend>
              <div className="flex flex-wrap gap-2">
                {ZONAS.map((z) => {
                  const on = zonas.includes(z);
                  return (
                    <button
                      key={z}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setZonas(on ? zonas.filter((x) => x !== z) : [...zonas, z])}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm capitalize transition-colors",
                        on
                          ? "border-primary bg-primary/15 font-semibold"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {z}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <Label htmlFor="equipo">Equipo disponible (opcional)</Label>
            <textarea
              id="equipo"
              rows={3}
              maxLength={500}
              value={equipo}
              onChange={(e) => setEquipo(e.target.value)}
              placeholder="Ej: máquinas de gym, mancuernas hasta 20 kg, sin barra olímpica"
              className={TEXTAREA}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleRutinas} disabled={!!busy || sinCuota}>
                {busy === "rutinas"
                  ? "Armando…"
                  : tieneRutinas
                    ? "Rearmar rutinas"
                    : "Armar rutinas"}
              </Button>
              {tieneRutinas && (
                <Button
                  variant="ghost"
                  onClick={() => handleBorrar("ejercicios")}
                  disabled={!!busy}
                >
                  Volver a las rutinas base
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        El coach usa Google Gemini (tier gratis): Google procesa tus mensajes y puede usarlos para
        mejorar sus productos. No mandamos tu email ni tu nombre. No reemplaza a un médico ni a un
        nutricionista.
      </p>
    </div>
  );
}
