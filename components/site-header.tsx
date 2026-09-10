import { getEvents, getNextEvent, getWeeks, PLAN_GOAL, PLAN_END } from "@/lib/training-plan";
import { DAYS_ES, MONTHS_ES, formatShort, todayNormalized } from "@/lib/date";

function nextEventLabel(): string {
  const today = todayNormalized();
  const next = getNextEvent(today);

  if (!next) return "Próximo evento: ninguno programado";

  const diffDays = Math.ceil((next.date.getTime() - today.getTime()) / 86_400_000);
  if (diffDays === 0) return `Próximo evento: ¡HOY ${next.name}!`;
  return `Próximo: ${next.name} (${formatShort(next.date)}) — en ${diffDays} días`;
}

/** Franja compacta de una sola línea con contexto fijo del plan — el H1 de cada página es el título principal. */
export function SiteHeader() {
  const today = todayNormalized();
  const todayLabel = `Hoy: ${DAYS_ES[today.getDay()]} ${today.getDate()} ${MONTHS_ES[today.getMonth()]}`;
  const weeksCount = getWeeks().length;
  const eventsCount = getEvents().length;

  return (
    <div className="border-b">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-4 py-2.5 text-xs lg:px-8">
        <p className="text-muted-foreground">
          Plan de Vida 2026 · {eventsCount} eventos · {weeksCount} semanas · Meta{" "}
          {PLAN_GOAL.weightKg}kg ({PLAN_GOAL.bodyFatPct} grasa) · Cierre {PLAN_END.getDate()}{" "}
          {MONTHS_ES[PLAN_END.getMonth()]}
        </p>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
            {todayLabel}
          </span>
          <span className="rounded-full bg-accent/15 px-2.5 py-1 font-medium text-foreground">
            {nextEventLabel()}
          </span>
        </div>
      </div>
    </div>
  );
}
