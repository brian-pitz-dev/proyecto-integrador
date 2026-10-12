"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { PlanWeek } from "@/lib/training-plan";

/** `w.start` es ISO YYYY-MM-DD: se parsea el string directo, sin pasar por `Date`, para no arrastrar el desfase de timezone (ver lib/date.ts fromISO). */
function monthKey(iso: string): string {
  const [year, month] = iso.split("-");
  return `${year}-${Number(month) - 1}`;
}

interface WeekSelectorProps {
  weeks: PlanWeek[];
  selectedWeek: number;
  onSelectWeek: (weekNum: number) => void;
}

/** Selector de mes → semanas del mes, con marca visual de evento/preparación (FR-019/020/021). */
export function WeekSelector({ weeks, selectedWeek, onSelectWeek }: WeekSelectorProps) {
  const selectedWeekObj = weeks.find((w) => w.num === selectedWeek) ?? weeks[0];
  const [selectedMonth, setSelectedMonth] = useState(() => monthKey(selectedWeekObj.start));

  const monthsInPlan = Array.from(new Set(weeks.map((w) => monthKey(w.start)))).map((key) => {
    const [year, month] = key.split("-").map(Number);
    return { key, label: new Date(year, month, 1).toLocaleDateString("es-AR", { month: "long" }) };
  });

  const weeksOfMonth = weeks.filter((w) => monthKey(w.start) === selectedMonth);

  return (
    <div className="grid gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          aria-label="Mes"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-fit rounded-md border border-border bg-background px-2.5 py-2 text-sm font-medium text-foreground capitalize"
        >
          {monthsInPlan.map(({ key, label }) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap gap-1.5">
          {weeksOfMonth.map((w) => (
            <button
              key={w.num}
              type="button"
              onClick={() => onSelectWeek(w.num)}
              title={w.phaseLabel}
              aria-pressed={w.num === selectedWeek}
              className={cn(
                "min-w-14 rounded-md border px-2.5 py-2 text-sm font-medium tabular-nums transition-colors",
                w.num === selectedWeek
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted",
                w.isEventWeek && "ring-2 ring-destructive/50",
                w.isPrepWeek && !w.isEventWeek && "ring-2 ring-accent/60",
              )}
            >
              Sem {w.num}
            </button>
          ))}
        </div>
      </div>

      {weeksOfMonth.some((w) => w.isEventWeek || w.isPrepWeek) && (
        <p className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full ring-2 ring-destructive/50" /> Semana de evento
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full ring-2 ring-accent/60" /> Semana previa
          </span>
        </p>
      )}
    </div>
  );
}
