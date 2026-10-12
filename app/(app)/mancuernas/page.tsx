import type { Metadata } from "next";
import { dumbbellRoutines } from "@/lib/dumbbell-exercises";

export const metadata: Metadata = {
  title: "Mancuernas · Plan de Vida 2026",
  description: "Ejercicios de mancuernas para pausas de Pomodoro en casa, por grupo muscular.",
  alternates: { canonical: "/mancuernas" },
};

export default function MancuernasPage() {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
      <div>
        <h1 className="text-4xl font-bold">Mancuernas</h1>
        <p className="max-w-prose text-muted-foreground">
          Rutinas cortas para hacer en casa, en una pausa o cuando el día no da para ir al gym. No
          son parte del plan semanal.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {Object.values(dumbbellRoutines).map((routine) => (
          <section key={routine.label} className="rounded-xl p-4 ring-1 ring-foreground/10">
            <h2 className="mb-3 text-xl font-semibold">{routine.label}</h2>
            <div className="grid gap-4">
              {routine.exercises.map((ex) => (
                <div key={ex.name} className="grid gap-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{ex.name}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">{ex.sets}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{ex.description}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
