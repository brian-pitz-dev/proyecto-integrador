import { gymRoutines, coreRoutines } from "@/lib/gym-exercises";

export function ExerciseBlock({ gymKey, coreKey }: { gymKey?: string; coreKey?: string }) {
  const routine = gymKey ? gymRoutines[gymKey] : coreKey ? coreRoutines[coreKey] : undefined;
  if (!routine) return null;

  return (
    <details className="group mt-1 text-sm">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
        {routine.label} ({routine.exercises.length} ejercicios)
      </summary>
      <ul className="mt-1.5 grid gap-1 border-l-2 border-border pl-3">
        {routine.exercises.map((ex) => (
          <li key={ex.name} className="flex justify-between gap-3">
            <span>{ex.name}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">{ex.sets}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
