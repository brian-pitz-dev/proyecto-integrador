"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { gymRoutines, coreRoutines } from "@/lib/gym-exercises";

export function ExerciseBlock({ gymKey, coreKey }: { gymKey?: string; coreKey?: string }) {
  const [open, setOpen] = useState(false);
  const routine = gymKey ? gymRoutines[gymKey] : coreKey ? coreRoutines[coreKey] : undefined;
  if (!routine) return null;

  return (
    <div className="mt-1.5 rounded-md border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-2.5 py-1.5 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <span>{routine.label}</span>
        <ChevronDown
          className={`size-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="grid gap-1 border-t border-border px-2.5 py-1.5">
          {routine.exercises.map((ex) => (
            <div key={ex.name} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-foreground">{ex.name}</span>
              <span className="text-muted-foreground">{ex.sets}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
