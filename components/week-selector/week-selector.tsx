"use client";

import { useState } from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { ChevronDown } from "lucide-react";
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
    const date = new Date(year, month, 1);
    const label = MONTH_LABELS[date.getMonth() - 7] ?? date.toLocaleDateString("es-AR", { month: "long" });
    return { key, date, label };
  });

  const weeksOfMonth = weeks.filter((w) => monthKey(w.start) === selectedMonth);

  return (
    <div className="grid gap-4">
      <SelectPrimitive.Root
        value={selectedMonth}
        onValueChange={(value) => setSelectedMonth(value as string)}
      >
        <SelectPrimitive.Trigger className="flex w-fit items-center justify-between gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-medium text-foreground">
          <SelectPrimitive.Value>
            {(value: string | null) => monthsInPlan.find((m) => m.key === value)?.label ?? ""}
          </SelectPrimitive.Value>
          <SelectPrimitive.Icon>
            <ChevronDown className="size-4 opacity-60" aria-hidden="true" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Positioner sideOffset={4} className="z-50">
            <SelectPrimitive.Popup className="rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
              <SelectPrimitive.List>
                {monthsInPlan.map(({ key, label }) => (
                  <SelectPrimitive.Item
                    key={key}
                    value={key}
                    className="cursor-default rounded-sm px-2.5 py-1.5 text-sm font-medium text-muted-foreground outline-none data-highlighted:bg-accent/20 data-selected:bg-primary data-selected:text-primary-foreground"
                  >
                    <SelectPrimitive.ItemText>{label}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.List>
            </SelectPrimitive.Popup>
          </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

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
