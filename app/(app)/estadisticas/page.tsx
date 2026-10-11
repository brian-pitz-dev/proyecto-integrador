import type { Metadata } from "next";
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
import { getMonday, todayNormalized } from "@/lib/date";
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
  return registros.slice(0, 5).map((r) => ({ id: r.id, label: format(r), date: r.fecha }));
}

export default async function EstadisticasPage() {
  const { completedDates, peso, sueno, calorias, caminata, tirada, evento } = await fetchData();
  const today = todayNormalized();

  const gymAtRisk = checkGymStreak(completedDates);
  const missingYesterdayItems = getMissingYesterdayItems(sueno, calorias, new Date());
  const hasRisk = gymAtRisk || missingYesterdayItems.length > 0;

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const { trainable: monthTrainable, completed: monthCompleted } = countTrainableVsCompleted(
    monthStart,
    today,
    completedDates,
  );
  const weekStart = getMonday(today);
  const { trainable: weekTrainable, completed: weekCompleted } = countTrainableVsCompleted(
    weekStart,
    today,
    completedDates,
  );

  const totalDist = caminata.reduce((a, r) => a + Number(r.valor || 0), 0);
  const avgSleep = sueno.length
    ? sueno.reduce((a, r) => a + Number(r.valor || 0), 0) / sueno.length
    : null;
  const totalRunKm = tirada.reduce((a, r) => a + Number(r.valor || 0), 0);

  const last3Paces = [...tirada, ...evento]
    .sort((a, b) => (a.fecha > b.fecha ? -1 : 1))
    .map((r) => paceStrToSeconds(r.nota))
    // más lento que 10:00/km es caminata (ej. Luján): no cuenta como ritmo de running
    .filter((p): p is number => p !== null && p < 10 * 60)
    .slice(0, 3);
  const avgPaceLabel = last3Paces.length
    ? formatPace(last3Paces.reduce((a, b) => a + b, 0) / last3Paces.length)
    : "—";

  const weightProgress = computeWeightProgress(
    peso.map((r) => Number(r.valor)),
    today,
  );
  const calorieTarget = await getCalorieTarget(today);
  const monthHistory = buildMonthHistory(completedDates);
  const bmrCalibradoActual = peso[0] ? computeBmrCalibrado(Number(peso[0].valor)) : null;

  function formatCalorias(r: Registro): string {
    const activas = Number(r.valor);
    if (bmrCalibradoActual === null) return `${r.valor} kcal activas`;
    const total = Math.round(bmrCalibradoActual + activas);
    return `${total} kcal total (${activas} activas)`;
  }

  const statBoxes = [
    { value: String(completedDates.size), label: "Días entrenados (total)" },
    { value: `${monthCompleted}/${monthTrainable}`, label: "Días este mes" },
    { value: `${weekCompleted}/${weekTrainable}`, label: "Días esta semana" },
    { value: totalDist.toFixed(1), label: "Km caminados (libre)" },
    { value: peso[0] ? String(peso[0].valor) : "—", label: "Último peso (kg)" },
    { value: avgSleep !== null ? formatSleepHours(avgSleep) : "—", label: "Promedio de sueño" },
    { value: totalRunKm.toFixed(1), label: "Km tirada larga (total)" },
    { value: avgPaceLabel, label: "Ritmo prom. últimas 3 tiradas" },
  ];

  return (
    <div className="grid gap-8">
      <h1 className="text-3xl font-bold text-foreground">Estadísticas</h1>

      {hasRisk ? (
        <Card className="border-destructive/30">
          <CardHeader className="border-b">
            <CardTitle className="text-destructive">Necesita atención</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <AlertBadge
              atRisk={missingYesterdayItems.length > 0}
              label={`Todavía no cargaste hoy: ${missingYesterdayItems.join(", ")}`}
              okLabel="Registro del día al día"
            />
            <AlertBadge
              atRisk={gymAtRisk}
              label="Perdiste 3 o más sesiones de gym programadas seguidas"
              okLabel="Racha de gym al día"
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-accent/30">
          <CardContent className="flex items-center gap-2 py-4 text-sm text-foreground">
            <CircleCheck className="size-4 text-accent" aria-hidden="true" />
            Todo en orden: sin rachas en riesgo.
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Resumen de logros
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {statBoxes.map((box) => (
            <div
              key={box.label}
              className="rounded-lg border-t-2 border-t-primary bg-card p-4 text-center ring-1 ring-foreground/10"
            >
              <p className="text-2xl font-bold text-primary">{box.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{box.label}</p>
            </div>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Progreso hacia el objetivo (80 kg)</CardTitle>
        </CardHeader>
        <CardContent className="pt-(--card-spacing)">
          {weightProgress ? (
            <div className="grid gap-2">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span>
                  Inicio:{" "}
                  <strong className="text-foreground">{weightProgress.start.toFixed(1)} kg</strong>
                </span>
                <span>
                  Actual:{" "}
                  <strong className="text-foreground">
                    {weightProgress.current.toFixed(1)} kg
                  </strong>
                </span>
                <span>
                  Meta: <strong className="text-foreground">{weightProgress.target} kg</strong>
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${weightProgress.pct.toFixed(0)}%` }}
                />
              </div>
              <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
                <span>{weightProgress.diffLabel}</span>
                <span>{weightProgress.daysLeft} días hasta el 31 dic</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Todavía no cargaste ningún peso.</p>
          )}
        </CardContent>
      </Card>

      <RegistroCategoryCard
        className="border-primary/30"
        icon={<Trophy className="size-4 text-primary" aria-hidden="true" />}
        title="Eventos del plan"
        buttonLabel="Registrar resultado de evento"
        entries={entriesOf(evento, (r) => `${r.nota} — ${r.valor} km`)}
      >
        <EventForm />
      </RegistroCategoryCard>

      <section className="grid gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Registro por categoría
        </h2>
        <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RegistroCategoryCard
            icon={<Scale className="size-4" aria-hidden="true" />}
            title="Peso"
            buttonLabel="Registrar peso"
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
            buttonLabel="Registrar sueño"
            entries={entriesOf(sueno, (r) => formatSleepHours(Number(r.valor)))}
          >
            <SleepForm />
          </RegistroCategoryCard>

          <RegistroCategoryCard
            icon={<Flame className="size-4" aria-hidden="true" />}
            title="Calorías"
            buttonLabel="Registrar calorías"
            entries={entriesOf(calorias, formatCalorias)}
          >
            <CalorieForm calorieTarget={calorieTarget} />
          </RegistroCategoryCard>

          <RegistroCategoryCard
            icon={<PersonStanding className="size-4" aria-hidden="true" />}
            title="Caminata"
            buttonLabel="Registrar caminata"
            entries={entriesOf(caminata, (r) => `${r.valor} km`)}
          >
            <NumericLogForm
              categoria="caminata"
              fieldLabel="Distancia (km)"
              step="0.01"
              successMessage="Caminata guardada"
            />
          </RegistroCategoryCard>

          <RegistroCategoryCard
            icon={<Footprints className="size-4" aria-hidden="true" />}
            title="Tirada larga"
            buttonLabel="Registrar tirada"
            entries={entriesOf(tirada, (r) => `${r.valor} km${r.nota ? ` — ${r.nota}` : ""}`)}
          >
            <RunForm />
          </RegistroCategoryCard>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Histórico mensual
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no cerró ningún mes</p>
              ) : (
                <ul className="grid gap-1.5">
                  {monthHistory.map((m) => (
                    <li key={m.label} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{m.label}</span>
                      <span className="text-muted-foreground">
                        {m.completed}/{m.trainable}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
