"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { toggleDayDone } from "@/app/(app)/calendario/actions";
import { getSessionsForDate, type PlanWeek, type Session } from "@/lib/training-plan";
import { toISO, fromISO, addDays, MONTHS_ES } from "@/lib/date";
import { WeekSelector } from "@/components/week-selector/week-selector";
import { ExerciseBlock } from "@/components/calendar-grid/exercise-block";

function currentWeekNum(weeks: PlanWeek[], todayNorm: Date): number {
  const w = weeks.find((wk) => {
    const start = fromISO(wk.start);
    return todayNorm >= start && todayNorm <= addDays(start, 6);
  });
  return w?.num ?? weeks[0]?.num ?? 1;
}

const DOW_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function isTrainable(sessions: Session[]): boolean {
  return sessions.some((s) => s.tag !== "rest");
}

export function CalendarGrid({
  completedDates,
  weeks,
}: {
  completedDates: string[];
  weeks: PlanWeek[];
}) {
  const today = new Date();
  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [selectedWeek, setSelectedWeek] = useState(() => currentWeekNum(weeks, todayNorm));
  const [completed, setCompleted] = useState(new Set(completedDates));
  const [isPending, startTransition] = useTransition();

  const weekObj = weeks.find((w) => w.num === selectedWeek) ?? weeks[0];
  const weekStart = fromISO(weekObj.start);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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
    <div className="mx-auto grid w-full max-w-4xl gap-5">
      <WeekSelector weeks={weeks} selectedWeek={selectedWeek} onSelectWeek={setSelectedWeek} />

      <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
        <p className="font-medium text-foreground">{weekObj.phaseLabel}</p>
        <p className="text-muted-foreground">
          Semana {weekObj.num} · {weekObj.start.slice(5)} al {toISO(addDays(weekStart, 6)).slice(5)}
        </p>
      </div>

      <div className="grid gap-3">
        {days.map((date, i) => {
          const iso = toISO(date);
          const isFuture = date > todayNorm;
          const isToday = toISO(todayNorm) === iso;
          const isDone = completed.has(iso);
          const sessions = getSessionsForDate(date);
          const trainable = isTrainable(sessions);

          return (
            <div
              key={iso}
              className={`rounded-md border p-4 text-sm ${
                isDone
                  ? "border-accent bg-accent/10"
                  : isToday
                    ? "border-ring ring-2 ring-ring/40"
                    : "border-border"
              } ${isFuture ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 gap-4">
                  <div className="w-14 shrink-0 self-center text-center">
                    <p className="text-xs font-medium text-muted-foreground">
                      {DOW_LABELS[i].slice(0, 3)}
                    </p>
                    <p className="text-lg font-semibold text-foreground">{date.getDate()}</p>
                    <p className="text-[0.65rem] uppercase text-muted-foreground">
                      {MONTHS_ES[date.getMonth()]}
                    </p>
                  </div>

                  <div className="min-w-0 flex-1 grid gap-2">
                    {sessions.map((s, si) => (
                      <div key={si} className="min-w-0">
                        <p className="break-words font-medium text-foreground">{s.label}</p>
                        {s.detail && (
                          <p className="break-words text-xs text-muted-foreground">{s.detail}</p>
                        )}
                        <ExerciseBlock gymKey={s.gymKey} coreKey={s.coreKey} />
                      </div>
                    ))}
                    {isDone && (
                      <p className="flex items-center gap-1 text-xs font-medium text-accent">
                        <Check className="size-3.5" aria-hidden="true" />
                        Completado
                      </p>
                    )}
                  </div>
                </div>

                {trainable && (
                  <button
                    type="button"
                    disabled={isFuture || isPending}
                    onClick={() => handleToggle(date)}
                    aria-label={isDone ? "Marcar como no completado" : "Marcar como completado"}
                    aria-pressed={isDone}
                    className={`flex size-9 shrink-0 self-center items-center justify-center rounded-full border-2 transition-colors ${
                      isDone
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border text-transparent hover:border-primary/60"
                    } disabled:opacity-40`}
                  >
                    <Check className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
