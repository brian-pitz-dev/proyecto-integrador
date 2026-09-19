import type { Metadata } from "next";
import { dumbbellRoutines } from "@/lib/dumbbell-exercises";

export const metadata: Metadata = {
  title: "Mancuernas · Plan de Vida 2026",
  description: "Ejercicios de mancuernas para pausas de Pomodoro en casa, por grupo muscular.",
  alternates: { canonical: "/mancuernas" },
};

export default function MancuernasPage() {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-5">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mancuernas</h1>
        <p className="text-sm text-muted-foreground">
          Para pausas de Pomodoro en casa — no es parte del plan semanal, usalas cuando el día no
          da para ir al gym. Elegí el grupo muscular que quieras trabajar.
        </p>
      </div>

      <div className="grid gap-4">
        {Object.values(dumbbellRoutines).map((routine) => (
          <div key={routine.label} className="rounded-lg border border-border p-4">
            <h2 className="mb-2 text-sm font-semibold text-foreground">{routine.label}</h2>
            <div className="grid gap-3">
              {routine.exercises.map((ex) => (
                <div key={ex.name} className="grid gap-0.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-foreground">{ex.name}</span>
                    <span className="text-muted-foreground">{ex.sets}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{ex.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
