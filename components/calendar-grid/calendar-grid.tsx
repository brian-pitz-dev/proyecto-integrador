"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { toggleDayDone } from "@/app/registro/actions";
import {
  getSessionsForDate,
  getCurrentWeekNum,
  getNextEvent,
  type Week,
  type UserEvent,
  type Session,
  type SessionTag,
} from "@/lib/training-plan";
import { toISO, fromISO, addDays, todayNormalized, formatShort, WEEKDAY_LABELS } from "@/lib/date";
import { cn } from "@/lib/utils";
import { WeekSelector } from "@/components/week-selector/week-selector";
import { ExerciseBlock } from "@/components/calendar-grid/exercise-block";
import { LogDialog } from "@/components/log-form/registro-category-card";
import { SleepForm } from "@/components/log-form/sleep-form";
import { CalorieForm } from "@/components/log-form/calorie-form";
import { NumericLogForm } from "@/components/log-form/numeric-log-form";

// Franja de color por tipo de sesión: naranja = correr/cardio, azul = fuerza
const TAG_STRIPE: Record<SessionTag, string> = {
  run: "border-run",
  long: "border-run",
  walk: "border-run",
  event: "border-run",
  luj: "border-run",
  gym: "border-gym",
  core: "border-gym",
  rest: "border-border",
};

function SessionList({ sessions }: { sessions: Session[] }) {
  return (
    <div className="grid min-w-0 flex-1 gap-3">
      {sessions.map((s, i) => (
        <div key={i} className={cn("min-w-0 border-l-[3px] pl-3", TAG_STRIPE[s.tag])}>
          <p className="font-semibold break-words text-foreground">{s.label}</p>
          {s.detail && <p className="text-sm break-words text-muted-foreground">{s.detail}</p>}
          <ExerciseBlock gymKey={s.gymKey} coreKey={s.coreKey} />
        </div>
      ))}
    </div>
  );
}

function DoneButton({
  isDone,
  disabled,
  onClick,
}: {
  isDone: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={isDone ? "Marcar como no completado" : "Marcar como completado"}
      aria-pressed={isDone}
      className={cn(
        "flex size-10 shrink-0 items-center justify-center self-center rounded-full border-2 transition-colors disabled:opacity-40",
        isDone
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border text-transparent hover:border-primary/60",
      )}
    >
      <Check className="size-5" aria-hidden="true" />
    </button>
  );
}

export function CalendarGrid({
  completedDates,
  weeks,
  events,
}: {
  completedDates: string[];
  weeks: Week[];
  events: UserEvent[];
}) {
  const todayNorm = todayNormalized();
  // el domingo ya interesa la semana que arranca
  const [selectedWeek, setSelectedWeek] = useState(() =>
    getCurrentWeekNum(weeks, todayNorm.getDay() === 0 ? addDays(todayNorm, 1) : todayNorm),
  );
  const [completed, setCompleted] = useState(new Set(completedDates));
  const [isPending, startTransition] = useTransition();

  const weekObj = weeks.find((w) => w.num === selectedWeek) ?? weeks[0];
  const weekStart = fromISO(weekObj.start);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const todayISO = toISO(todayNorm);
  const todaySessions = getSessionsForDate(weeks, events, todayNorm);
  const nextEvent = getNextEvent(events, todayNorm);
  const daysToEvent = nextEvent
    ? Math.round((fromISO(nextEvent.fecha).getTime() - todayNorm.getTime()) / 86_400_000)
    : null;

  function handleToggle(date: Date) {
    if (date > todayNorm) return; // no se puede marcar un día futuro
    const iso = toISO(date);
    const isDone = !completed.has(iso);

    const next = new Set(completed);
    if (isDone) next.add(iso);
    else next.delete(iso);
    setCompleted(next);

    startTransition(async () => {
      const result = await toggleDayDone(iso, isDone);
      if (!result.ok) {
        toast.error(result.message ?? "No se pudo actualizar el día.");
        setCompleted(completed); // revertir
      }
    });
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-8">
      <section className="grid gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-2xl font-semibold">
            Hoy, {WEEKDAY_LABELS[(todayNorm.getDay() + 6) % 7].toLowerCase()}{" "}
            {formatShort(todayNorm)}
          </h2>
          {nextEvent && daysToEvent !== null && (
            <p className="text-sm text-muted-foreground">
              {daysToEvent === 0
                ? `Hoy es el ${nextEvent.nombre}`
                : `${nextEvent.nombre} en ${daysToEvent} día${daysToEvent === 1 ? "" : "s"}`}
            </p>
          )}
        </div>

        <div className="flex items-start gap-4">
          <SessionList sessions={todaySessions} />
          {todaySessions.some((s) => s.tag !== "rest") && (
            <DoneButton
              isDone={completed.has(todayISO)}
              disabled={isPending}
              onClick={() => handleToggle(todayNorm)}
            />
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t pt-4">
          <LogDialog title="Sueño" buttonLabel="Sueño">
            <SleepForm />
          </LogDialog>
          <LogDialog title="Calorías" buttonLabel="Calorías">
            <CalorieForm />
          </LogDialog>
          <LogDialog title="Peso" buttonLabel="Peso">
            <NumericLogForm
              categoria="peso"
              fieldLabel="Peso (kg)"
              step="0.1"
              successMessage="Peso guardado"
            />
          </LogDialog>
        </div>
      </section>

      <section className="grid gap-4">
        <WeekSelector weeks={weeks} selectedWeek={selectedWeek} onSelectWeek={setSelectedWeek} />

        <div>
          <h2 className="text-xl font-semibold">{weekObj.phaseLabel}</h2>
          <p className="text-sm text-muted-foreground">
            Semana {weekObj.num}, del {weekStart.getDate()} al {formatShort(addDays(weekStart, 6))}
          </p>
        </div>

        <div className="grid gap-2">
          {days.map((date, i) => {
            const iso = toISO(date);
            const sessions = getSessionsForDate(weeks, events, date);
            const dayLabel = WEEKDAY_LABELS[i].slice(0, 3);

            if (sessions.every((s) => s.tag === "rest")) {
              return (
                <div key={iso} className="flex gap-4 px-4 py-1.5 text-sm text-muted-foreground">
                  <span className="w-14 shrink-0 text-center tabular-nums">
                    {dayLabel} {date.getDate()}
                  </span>
                  <span>{sessions[0].label}</span>
                </div>
              );
            }

            const isDone = completed.has(iso);
            return (
              <div
                key={iso}
                className={cn(
                  "flex items-start gap-4 rounded-lg border p-4",
                  isDone ? "border-accent bg-accent/10" : "border-border",
                  iso === todayISO && !isDone && "ring-2 ring-ring/40",
                )}
              >
                <div className="w-10 shrink-0 text-center">
                  <p className="text-xs text-muted-foreground">{dayLabel}</p>
                  <p className="font-heading text-2xl leading-tight font-semibold tabular-nums">
                    {date.getDate()}
                  </p>
                </div>
                <SessionList sessions={sessions} />
                <DoneButton
                  isDone={isDone}
                  disabled={date > todayNorm || isPending}
                  onClick={() => handleToggle(date)}
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
