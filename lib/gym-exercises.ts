/**
 * Rutinas de gym y core — portado 1:1 de plan_vida_2026.html.
 * Referenciado por Session.gymKey / Session.coreKey en lib/training-plan.ts.
 */

export interface Exercise {
  name: string;
  sets: string;
}

export interface Routine {
  label: string;
  exercises: Exercise[];
}

export const gymRoutines: Record<string, Routine> = {
  empuje: {
    label: "Empuje — Tren superior",
    exercises: [
      { name: "Chest Press", sets: "3×10-15" },
      { name: "Incline Press", sets: "3×10-15" },
      { name: "Shoulder Press", sets: "3×10-12" },
      { name: "Tricep Pushdown", sets: "3×10-15" },
      { name: "Pec Fly / Contractor", sets: "3×12-15" },
    ],
  },
  tiron: {
    label: "Tirón — Tren superior",
    exercises: [
      { name: "Lat Pull Down", sets: "3×10-15" },
      { name: "Upright Row", sets: "3×10-12" },
      { name: "Deltoid Raise", sets: "3×12-15" },
      { name: "Arm Curl", sets: "3×10-15" },
      { name: "Pectoral Crossover", sets: "3×12-15" },
    ],
  },
  inferior: {
    label: "Tren inferior",
    exercises: [
      { name: "Squat con cable", sets: "4×12-15" },
      { name: "Leg Extension", sets: "4×12-15" },
      { name: "Leg Curl", sets: "4×12-15" },
    ],
  },
  empujeLight: {
    label: "Empuje liviano",
    exercises: [
      { name: "Chest Press", sets: "2×10, 60-70%" },
      { name: "Incline Press", sets: "2×10" },
      { name: "Shoulder Press", sets: "2×10" },
    ],
  },
  tironLight: {
    label: "Tirón liviano",
    exercises: [
      { name: "Lat Pull Down", sets: "2×10, 60-70%" },
      { name: "Upright Row", sets: "2×10" },
      { name: "Arm Curl", sets: "2×10" },
    ],
  },
  inferiorLight: {
    label: "Piernas — activación",
    exercises: [
      { name: "Squat con cable", sets: "2×12, muy suave" },
      { name: "Leg Extension", sets: "2×12, sin fallo" },
    ],
  },
  upperOnly: {
    label: "Solo superior — nada de piernas",
    exercises: [
      { name: "Chest Press", sets: "2×8, 60%" },
      { name: "Lat Pull Down", sets: "2×8, 60%" },
      { name: "Deltoid Raise", sets: "2×10, suave" },
    ],
  },
};

export const coreRoutines: Record<string, Routine> = {
  base: {
    label: "Rutina base — Core en casa",
    exercises: [
      { name: "Plank frontal", sets: "3×30-40 seg" },
      { name: "Plank lateral", sets: "2×25-30 seg c/lado" },
      { name: "Dead bug", sets: "3×8-10 reps" },
      { name: "Glute bridge", sets: "3×15 reps" },
      { name: "Bird dog", sets: "2×10 reps c/lado" },
    ],
  },
  light: {
    label: "Core liviano — semana descarga",
    exercises: [
      { name: "Plank frontal", sets: "2×25 seg" },
      { name: "Plank lateral", sets: "2×20 seg c/lado" },
      { name: "Dead bug", sets: "2×8 reps" },
      { name: "Glute bridge", sets: "2×12 reps" },
    ],
  },
};
