import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, Scale, Moon, Flame, PersonStanding, Footprints, Trophy } from "lucide-react";
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
import { getCalorieTarget, computeBmrCalibrado } from "@/lib/calorie-target";
import {
  countTrainableVsCompleted,
  computeWeightProgress,
  formatSleepHours,
  buildMonthHistory,
  getMissingYesterdayItems,
} from "@/lib/stats-summary";
import { getUserPlanContext } from "@/lib/user-plan";
import { getMonday, todayNormalized, fromISO, formatShort } from "@/lib/date";
import { formatPace, paceStrToSeconds } from "@/lib/pace";
import type { Categoria, Registro } from "@/lib/types";

export const metadata: Metadata = {
  title: "Estadísticas · Plan de Vida 2026",
  description: "Resumen de logros, progreso de peso y registro de datos diarios.",
  alternates: { canonical: "/estadisticas" },
};

async function fetchData() {
  const supabase = await createClient();
  // ponytail: una sola query, PostgREST corta en 1000 filas; con un usuario y el plan hasta dic no se llega, si no volver a una query por categoría
  const { data } = await supabase.from("registro").select("*").order("fecha", { ascending: false });
  const rows = (data as Registro[] | null) ?? [];
  const of = (categoria: Categoria) => rows.filter((r) => r.categoria === categoria);

  return {
    completedDates: new Set(of("completado").map((r) => r.fecha)),
    peso: of("peso"),
    sueno: of("sueno"),
    calorias: of("calorias"),
    caminata: of("caminata"),
    tirada: of("tirada"),
    evento: of("evento"),
  };
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

  const last3Paces = [...tirada, ...evento]
    .sort((a, b) => (a.fecha > b.fecha ? -1 : 1))
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
  const calorieTarget = await getCalorieTarget(today, profile, weeks);
  const monthHistory = buildMonthHistory(weeks, events, planStart, completedDates);
  const bmrCalibradoActual = peso[0] ? computeBmrCalibrado(Number(peso[0].valor), profile) : null;

  function formatCalorias(r: Registro): string {
    const activas = Number(r.valor);
    if (bmrCalibradoActual === null) return `${r.valor} kcal activas`;
    const total = Math.round(bmrCalibradoActual + activas);
    return `${total} kcal (${activas} activas)`;
  }

  const statBoxes = [
    { value: `${weekCompleted}/${weekTrainable}`, label: "Entrenamientos esta semana" },
    { value: avgPaceLabel, label: "Ritmo promedio, últimas 3 corridas" },
    { value: peso[0] ? `${peso[0].valor} kg` : "—", label: "Último peso" },
    { value: avgSleep !== null ? formatSleepHours(avgSleep) : "—", label: "Sueño promedio" },
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
            <p className="font-heading text-3xl font-semibold tabular-nums">{box.value}</p>
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
