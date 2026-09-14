"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { PlanWeek } from "@/lib/training-plan";

const MONTH_LABELS = ["Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

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
    return { key, date: new Date(year, month, 1) };
  });

  const weeksOfMonth = weeks.filter((w) => monthKey(w.start) === selectedMonth);

  return (
    <div className="grid gap-4">
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-medium text-foreground"
      >
        {monthsInPlan.map(({ key, date }) => (
          <option key={key} value={key}>
            {MONTH_LABELS[date.getMonth() - 7] ??
              date.toLocaleDateString("es-AR", { month: "long" })}
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
            className={cn(
              "min-w-11 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
              w.num === selectedWeek
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:bg-accent/10",
              w.isEventWeek && "ring-2 ring-destructive/50",
              w.isPrepWeek && !w.isEventWeek && "ring-2 ring-accent/60",
            )}
          >
            Sem {w.num}
          </button>
        ))}
      </div>
    </div>
  );
}
