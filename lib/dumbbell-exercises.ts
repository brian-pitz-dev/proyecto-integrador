/**
 * Rutinas de mancuernas para pausas de Pomodoro (5 min) en casa.
 * No forma parte del plan semanal (lib/training-plan.ts): es una referencia
 * ad-hoc para cuando el día no da para ir al gym.
 * 2-3 ejercicios simples por grupo muscular, con descripción de la técnica.
 */

export interface DumbbellExercise {
  name: string;
  sets: string;
  description: string;
}

export interface DumbbellRoutine {
  label: string;
  exercises: DumbbellExercise[];
}

export const dumbbellRoutines: Record<string, DumbbellRoutine> = {
  superior: {
    label: "Tren superior",
    exercises: [
      {
        name: "Press de pecho",
        sets: "3×12",
        description:
          "Acostado (en el piso o un banco), mancuernas a la altura del pecho, empujar hacia arriba hasta extender los brazos y bajar controlado.",
      },
      {
        name: "Press de hombros",
        sets: "3×10",
        description:
          "Sentado o parado, mancuernas a la altura de los hombros con codos flexionados, empujar hacia arriba hasta extender los brazos y bajar controlado.",
      },
      {
        name: "Curl de bíceps",
        sets: "2×12",
        description:
          "Parado, brazos extendidos a los costados, flexionar el codo llevando la mancuerna al hombro sin mover el brazo superior, y bajar controlado.",
      },
    ],
  },
  inferiorGluteos: {
    label: "Piernas y glúteos",
    exercises: [
      {
        name: "Sentadilla goblet",
        sets: "3×12",
        description:
          "Sostener una mancuerna con ambas manos contra el pecho, bajar en sentadilla manteniendo la espalda recta y las rodillas alineadas con los pies, y subir.",
      },
      {
        name: "Peso muerto rumano",
        sets: "3×10",
        description:
          "Parado con una mancuerna en cada mano, bajar deslizándolas cerca de las piernas con rodillas casi rectas hasta sentir el estiramiento en los isquios, y volver a subir.",
      },
      {
        name: "Estocadas",
        sets: "2×10 c/pierna",
        description:
          "Dar un paso al frente y bajar hasta que ambas rodillas queden en 90°, sin que la rodilla de adelante pase la punta del pie, y volver a la posición inicial.",
      },
    ],
  },
  fullBody: {
    label: "Full body rápido",
    exercises: [
      {
        name: "Peso muerto",
        sets: "3×10",
        description:
          "Parado con las mancuernas frente a los muslos, bisagra de cadera manteniendo la espalda recta para bajarlas hasta cerca del piso, y volver a subir.",
      },
      {
        name: "Sentadilla con press",
        sets: "2×10",
        description:
          "Hacer una sentadilla con una mancuerna en cada hombro y, al subir, extender los brazos empujándolas hacia arriba.",
      },
      {
        name: "Remo inclinado",
        sets: "2×12",
        description:
          "Inclinar el torso hacia adelante con espalda recta y rodillas semiflexionadas, llevar las mancuernas hacia las costillas apretando la espalda, y bajar controlado.",
      },
    ],
  },
};
