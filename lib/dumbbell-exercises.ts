/**
 * Rutinas de mancuernas para pausas de Pomodoro (5 min) en casa.
 * No forma parte del plan semanal (lib/training-plan.ts): es una referencia
 * ad-hoc para cuando el día no da para ir al gym.
 */
import type { Exercise, Routine } from "./gym-exercises";

export type { Exercise, Routine };

export const dumbbellRoutines: Record<string, Routine> = {
  superior: {
    label: "Tren superior",
    exercises: [
      { name: "Chest press", sets: "3×12" },
      { name: "Shoulder press", sets: "3×10" },
      { name: "Bicep curl", sets: "2×12" },
      { name: "Tricep extension", sets: "2×12" },
    ],
  },
  inferiorGluteos: {
    label: "Piernas y glúteos",
    exercises: [
      { name: "Goblet squat", sets: "3×12" },
      { name: "Romanian deadlift", sets: "3×10" },
      { name: "Lunges", sets: "2×10 c/pierna" },
      { name: "Glute bridge con mancuerna", sets: "2×15" },
    ],
  },
  fullBody: {
    label: "Full body rápido",
    exercises: [
      { name: "Deadlift", sets: "3×10" },
      { name: "Push press", sets: "2×10" },
      { name: "Renegade row", sets: "2×8 c/lado" },
      { name: "Swing", sets: "2×15" },
    ],
  },
};
