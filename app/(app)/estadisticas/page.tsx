import type { Metadata } from "next";
import Link from "next/link";
import {
  CircleCheck,
  Scale,
  Moon,
  Flame,
  PersonStanding,
  Footprints,
  Trophy,
  Timer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertBadge } from "@/components/stats/alert-badge";
import { RegistroCategoryCard } from "@/components/log-form/registro-category-card";
import { RunForm } from "@/components/log-form/run-form";
import { NumericLogForm } from "@/components/log-form/numeric-log-form";
import { CalorieForm } from "@/components/log-form/calorie-form";
import { SleepForm } from "@/components/log-form/sleep-form";
import { EventForm } from "@/components/log-form/event-form";
import { createClient } from "@/lib/supabase/server";
import { checkGymStreak } from "@/lib/streaks";
import { calcularMeta, computeBmrCalibrado } from "@/lib/calorie-target";
import {
  countTrainableVsCompleted,
  computeWeightProgress,
  formatSleepHours,
  buildMonthHistory,
  getMissingYesterdayItems,
} from "@/lib/stats-summary";
import { getUserPlanContext } from "@/lib/user-plan";
import { getPhaseKeyForDate } from "@/lib/training-plan";
import { getMonday, todayNormalized, fromISO, formatShort, toISO } from "@/lib/date";
import { formatDuracion, formatPace, paceStrToSeconds } from "@/lib/pace";
import { esfuerzosDe, predecirCarrera } from "@/lib/race-prediction";
import { LineaTiempo, type Punto } from "@/components/stats/linea-tiempo";
import type { Categoria, Registro } from "@/lib/types";

export const metadata: Metadata = {
  title: "Estadísticas · Bakata",
  description: "Resumen de logros, progreso de peso y registro de datos diarios.",
  alternates: { canonical: "/estadisticas" },
};

async function fetchData() {
  const supabase = await createClient();
  // Una query por categoría: PostgREST corta cada respuesta en 1000 filas, y todas juntas se
  // pasaban en ~8 meses de uso diario (el peso "inicial" y el historial salían mal).
  // shortcut: cada categoría sigue topada en 1000 filas (~2.7 años de un registro por día);
  // si alguien llega, paginar con .range() o agregar en SQL.
  const of = async (categoria: Categoria) => {
    const { data } = await supabase
      .from("registro")
      .select("*")
      .eq("categoria", categoria)
      .order("fecha", { ascending: false })
      // varios registros el mismo día (ej. un peso corregido): arriba y como "último", el último cargado
      .order("created_at", { ascending: false });
    return (data as Registro[] | null) ?? [];
  };
  const [completado, peso, sueno, calorias, caminata, tirada, evento] = await Promise.all(
    (["completado", "peso", "sueno", "calorias", "caminata", "tirada", "evento"] as const).map(of),
  );

  return {
    completedDates: new Set(completado.map((r) => r.fecha)),
    peso,
    sueno,
    calorias,
    caminata,
    tirada,
    evento,
  };
}

/** Un punto por día, ascendente. `regs` vienen por fecha desc: el primero de cada día es el último cargado. */
function serie(regs: Registro[], valor: (r: Registro) => number | null): Punto[] {
  const porDia = new Map<string, number>();
  for (const r of regs) {
    const v = valor(r);
    if (v !== null && !porDia.has(r.fecha)) porDia.set(r.fecha, v);
  }
  return [...porDia].map(([fecha, v]) => ({ fecha, valor: v })).reverse();
}

function entriesOf(registros: Registro[], format: (r: Registro) => string) {
  return registros
    .slice(0, 5)
    .map((r) => ({ id: r.id, label: format(r), date: formatShort(fromISO(r.fecha)) }));
}

export default async function EstadisticasPage() {
  const [{ completedDates, peso, sueno, calorias, caminata, tirada, evento }, planContext] =
    await Promise.all([fetchData(), getUserPlanContext()]);
  if (!planContext) return null; // proxy.ts ya redirige a /onboarding antes de esto
  const { profile, events, weeks } = planContext;
  const today = todayNormalized();
  const planStart = fromISO(profile.planStart);

  const gymAtRisk = checkGymStreak(weeks, events, completedDates);
  const missingYesterdayItems = getMissingYesterdayItems(sueno, calorias, new Date());

  const { trainable: weekTrainable, completed: weekCompleted } = countTrainableVsCompleted(
    weeks,
    events,
    planStart,
    getMonday(today),
    today,
    completedDates,
  );
  const avgSleep = sueno.length
    ? sueno.reduce((a, r) => a + Number(r.valor || 0), 0) / sueno.length
    : null;

  const corridas = [...tirada, ...evento].sort((a, b) => (a.fecha > b.fecha ? -1 : 1));
  const last3Paces = corridas
    .map((r) => paceStrToSeconds(r.nota))
    // más lento que 10:00/km es caminata: no cuenta como ritmo de running
    .filter((p): p is number => p !== null && p < 10 * 60)
    .slice(0, 3);
  const avgPaceLabel = last3Paces.length
    ? formatPace(last3Paces.reduce((a, b) => a + b, 0) / last3Paces.length)
    : "—";

  const weightProgress = computeWeightProgress(
    peso.map((r) => Number(r.valor)),
    profile.metaPesoKg ?? profile.pesoInicialKg,
    events,
    today,
  );
  // con los datos ya traídos: getCalorieTarget volvería a buscar peso y calorías en otro viaje
  const caloriasHoy = calorias.find((r) => r.fecha === toISO(today));
  const calorieTarget = peso[0]
    ? calcularMeta(
        Number(peso[0].valor),
        caloriasHoy ? Number(caloriasHoy.valor) : null,
        profile,
        getPhaseKeyForDate(weeks, today),
      )
    : null;
  const pesoSerie = serie(peso, (r) => Number(r.valor));
  const ritmoSerie = serie(corridas, (r) => {
    const p = paceStrToSeconds(r.nota);
    return p !== null && p < 10 * 60 ? p : null;
  });
  const esfuerzos = esfuerzosDe(corridas);
  const predicciones = events
    .filter((e) => e.tipo === "carrera" && fromISO(e.fecha) >= today)
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1))
    .map((ev) => ({ ev, p: predecirCarrera(esfuerzos, ev.distanciaKm, today) }));
  const monthHistory = buildMonthHistory(weeks, events, planStart, completedDates);
  const bmrCalibradoActual = peso[0] ? computeBmrCalibrado(Number(peso[0].valor), profile) : null;

  function formatCalorias(r: Registro): string {
    const activas = Number(r.valor);
    if (bmrCalibradoActual === null) return `${r.valor} kcal activas`;
    const total = Math.round(bmrCalibradoActual + activas);
    return `${total} kcal (${activas} activas)`;
  }

  const statBoxes = [
    {
      icon: CircleCheck,
      value: `${weekCompleted}/${weekTrainable}`,
      label: "Entrenamientos esta semana",
    },
    { icon: Timer, value: avgPaceLabel, label: "Ritmo promedio, últimas 3 corridas" },
    { icon: Scale, value: peso[0] ? `${peso[0].valor} kg` : "—", label: "Último peso" },
    {
      icon: Moon,
      value: avgSleep !== null ? formatSleepHours(avgSleep) : "—",
      label: "Sueño promedio",
    },
  ];

  return (
    <div className="grid gap-8">
      <h1 className="text-4xl font-bold">Estadísticas</h1>

      {gymAtRisk || missingYesterdayItems.length > 0 ? (
        <div className="grid gap-2">
          <AlertBadge
            atRisk={missingYesterdayItems.length > 0}
            label={
              <>
                Te falta cargar: {missingYesterdayItems.join(", ")}.{" "}
                <Link href="/calendario" className="font-semibold underline underline-offset-2">
                  Cargalo desde Hoy
                </Link>
              </>
            }
            okLabel="Registro del día al día"
          />
          <AlertBadge
            atRisk={gymAtRisk}
            label="Te salteaste 3 o más sesiones de gym seguidas."
            okLabel="Racha de gym al día"
          />
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm">
          <CircleCheck className="size-4 text-accent" aria-hidden="true" />
          Todo al día: cargaste los datos de ayer y venís cumpliendo el gym.
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <h2 className="sr-only">Resumen</h2>
        {statBoxes.map((box) => (
          <div key={box.label} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <box.icon className="size-4 text-primary" aria-hidden="true" />
            <p className="font-heading mt-2 text-3xl font-semibold tabular-nums">{box.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{box.label}</p>
          </div>
        ))}
      </section>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg font-semibold">
            {profile.metaPesoKg
              ? `Objetivo: ${profile.metaPesoKg} kg${profile.metaGrasaPct ? ` y ${profile.metaGrasaPct} de grasa` : ""}`
              : "Progreso de peso"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weightProgress ? (
            <div className="grid gap-2">
              <div className="flex flex-wrap justify-between gap-2 text-sm tabular-nums">
                <span>
                  Inicio: <strong>{weightProgress.start.toFixed(1)} kg</strong>
                </span>
                <span>
                  Actual: <strong>{weightProgress.current.toFixed(1)} kg</strong>
                </span>
                <span>
                  Meta: <strong>{weightProgress.target} kg</strong>
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${weightProgress.pct.toFixed(0)}%` }}
                />
              </div>
              <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
                <span>{weightProgress.diffLabel}</span>
                {weightProgress.daysToNextEvent !== null && (
                  <span>{weightProgress.daysToNextEvent} días hasta tu próximo evento</span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Cargá tu peso desde Hoy para ver el progreso.
            </p>
          )}
        </CardContent>
      </Card>

      {predicciones.length > 0 && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg font-semibold">
              Tiempo estimado para tus carreras
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ul className="grid gap-4 sm:grid-cols-2">
              {predicciones.map(({ ev, p }) => {
                const ritmo = p ? p.seg / ev.distanciaKm : null;
                const dif =
                  ritmo && ev.ritmoObjetivoSeg ? Math.round(ritmo - ev.ritmoObjetivoSeg) : null;
                return (
                  <li key={ev.id} className="grid gap-1">
                    <p className="text-sm text-muted-foreground">
                      {ev.nombre} · {ev.distanciaKm} km
                    </p>
                    {p && ritmo ? (
                      <>
                        <p className="font-heading text-3xl font-semibold tabular-nums">
                          {formatDuracion(p.seg)}{" "}
                          <span className="text-base font-normal text-muted-foreground">
                            {formatPace(ritmo)}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Según tu corrida de {p.base.km} km del{" "}
                          {formatShort(fromISO(p.base.fecha))}.
                        </p>
                        {dif !== null && ev.ritmoObjetivoSeg && (
                          <p className="text-sm">
                            {dif > 0
                              ? `Tu objetivo es ${formatPace(ev.ritmoObjetivoSeg)}: te faltan ${dif} s/km.`
                              : `Ya estás en ritmo de tu objetivo (${formatPace(ev.ritmoObjetivoSeg)}).`}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm">
                        Registrá una tirada de al menos {Math.ceil(Math.max(3, ev.distanciaKm / 4))}{" "}
                        km en los últimos 60 días para estimar tu tiempo.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-muted-foreground">
              Estimación con la fórmula de Riegel: orientativa, y supone que entrenaste para esa
              distancia.
            </p>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold">Evolución</h2>
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Peso</CardTitle>
            </CardHeader>
            <CardContent>
              {pesoSerie.length >= 2 ? (
                <LineaTiempo puntos={pesoSerie} tipo="kg" meta={profile.metaPesoKg} nombre="Peso" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Cargá tu peso al menos dos días para ver cómo evoluciona.
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ritmo de tus corridas</CardTitle>
            </CardHeader>
            <CardContent>
              {ritmoSerie.length >= 2 ? (
                <>
                  <p className="mb-2 text-xs text-muted-foreground">Más arriba = más rápido.</p>
                  <LineaTiempo puntos={ritmoSerie} tipo="ritmo" nombre="Ritmo" />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Registrá al menos dos corridas para ver cómo evoluciona tu ritmo.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold">Registros</h2>
        <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RegistroCategoryCard
            icon={<Scale className="size-4" aria-hidden="true" />}
            title="Peso"
            buttonLabel="Cargar"
            entries={entriesOf(peso, (r) => `${r.valor} kg`)}
          >
            <NumericLogForm
              categoria="peso"
              fieldLabel="Peso (kg)"
              step="0.1"
              successMessage="Peso guardado"
            />
          </RegistroCategoryCard>

          <RegistroCategoryCard
            icon={<Moon className="size-4" aria-hidden="true" />}
            title="Sueño"
            buttonLabel="Cargar"
            entries={entriesOf(sueno, (r) => formatSleepHours(Number(r.valor)))}
          >
            <SleepForm />
          </RegistroCategoryCard>

          <RegistroCategoryCard
            icon={<Flame className="size-4" aria-hidden="true" />}
            title="Calorías"
            buttonLabel="Cargar"
            entries={entriesOf(calorias, formatCalorias)}
          >
            <CalorieForm calorieTarget={calorieTarget} />
          </RegistroCategoryCard>

          <RegistroCategoryCard
            icon={<Footprints className="size-4 text-run" aria-hidden="true" />}
            title="Tirada larga"
            buttonLabel="Cargar"
            entries={entriesOf(tirada, (r) => `${r.valor} km${r.nota ? `, ${r.nota}` : ""}`)}
          >
            <RunForm />
          </RegistroCategoryCard>

          <RegistroCategoryCard
            icon={<Trophy className="size-4 text-run" aria-hidden="true" />}
            title="Eventos"
            buttonLabel="Cargar"
            entries={entriesOf(evento, (r) => `${r.nota}, ${r.valor} km`)}
          >
            <EventForm events={events} />
          </RegistroCategoryCard>

          <RegistroCategoryCard
            icon={<PersonStanding className="size-4" aria-hidden="true" />}
            title="Caminata"
            buttonLabel="Cargar"
            entries={entriesOf(caminata, (r) => `${r.valor} km`)}
          >
            <NumericLogForm
              categoria="caminata"
              fieldLabel="Distancia (km)"
              step="0.01"
              successMessage="Caminata guardada"
            />
          </RegistroCategoryCard>
        </div>
      </section>

      {monthHistory.length > 0 && (
        <section className="grid gap-3">
          <h2 className="text-2xl font-semibold">Días entrenados por mes</h2>
          <ul className="grid gap-2">
            {monthHistory.map((m) => (
              <li
                key={m.label}
                className="grid grid-cols-[5rem_1fr_3.5rem] items-center gap-3 text-sm"
              >
                <span className="capitalize">{m.label}</span>
                <span className="h-2 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${m.trainable ? (m.completed / m.trainable) * 100 : 0}%` }}
                  />
                </span>
                <span className="text-right text-muted-foreground tabular-nums">
                  {m.completed}/{m.trainable}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
