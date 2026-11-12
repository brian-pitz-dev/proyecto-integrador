import { gymRoutines, coreRoutines, type Routine } from "@/lib/gym-exercises";

export function ExerciseBlock({
  gymKey,
  coreKey,
  routines,
  maxEjercicios,
}: {
  gymKey?: string;
  coreKey?: string;
  /** Con poco tiempo por sesión se muestran solo los primeros (los compuestos van primero). */
  maxEjercicios?: number;
  /** Rutinas propias del usuario (IA); si no tiene la gymKey, cae a la compartida. */
  routines?: Record<string, Routine>;
}) {
  const routine = gymKey
    ? (routines?.[gymKey] ?? gymRoutines[gymKey])
    : coreKey
      ? coreRoutines[coreKey]
      : undefined;
  if (!routine) return null;
  const exercises = routine.exercises.slice(0, maxEjercicios);

  return (
    <details className="group mt-1 text-sm">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
        {routine.label} ({exercises.length} ejercicios)
      </summary>
      <ul className="mt-1.5 grid gap-1 border-l-2 border-border pl-3">
        {exercises.map((ex) => (
          <li key={ex.name} className="flex justify-between gap-3">
            <span>{ex.name}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">{ex.sets}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
