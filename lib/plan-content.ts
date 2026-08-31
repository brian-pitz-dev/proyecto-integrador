/** Contenido estático de Eventos y Reglas — portado de plan_vida_2026.html (footer). No es dato de Supabase. */

export interface EventCard {
  title: string;
  dateLabel: string;
  paragraphs: { label: string; text: string }[];
}

export const EVENT_CARDS: EventCard[] = [
  {
    title: "Carrera 10K",
    dateLabel: "Domingo 13 de septiembre 2026",
    paragraphs: [
      { label: "Meta", text: "menos de 1 hora (ideal 6:30-6:45 min/km)." },
      {
        label: "Nutrición del día anterior",
        text: "subí un poco los carbohidratos (arroz/fideos/papa) en el almuerzo y cena del sábado, mantené la proteína igual.",
      },
      {
        label: "El día",
        text: "desayuno liviano y conocido 2-3hs antes, nada nuevo. Hidratación normal, no exagerada.",
      },
    ],
  },
  {
    title: "Procesión a Luján — 80 km",
    dateLabel: "Sábado 3 de octubre 2026 · De un tirón",
    paragraphs: [
      { label: "Objetivo", text: "llegar bien de físico, sin meta de tiempo." },
      {
        label: "Días previos",
        text: "carga de carbohidratos los 2-3 días antes (más arroz/papa/fideos en cada almuerzo y cena), buena hidratación.",
      },
      {
        label: "Durante",
        text: "comé y tomá líquido con sales de forma constante, no esperes a tener hambre o sed.",
      },
      {
        label: "Después",
        text: "proteína + carbohidratos apenas puedas, y la semana siguiente es de recuperación real — no hay apuro en volver a entrenar fuerte.",
      },
    ],
  },
  {
    title: "Media Maratón 21K — Mar del Plata",
    dateLabel: "Domingo 8 de noviembre 2026",
    paragraphs: [
      { label: "Meta", text: "7:30 min/km (~2:38 total)." },
      {
        label: "Estrategia",
        text: "km 1-5 controlado, km 5-15 sostener, km 15+ lo que tengas. Caminar los puestos de hidratación no arruina el tiempo.",
      },
      {
        label: "Nutrición del día anterior",
        text: "igual que en el 10K, más carbohidratos, proteína normal.",
      },
    ],
  },
];

export interface RuleCard {
  title: string;
  tone: "green" | "orange" | "purple" | "pink";
  rules: string[];
}

export const RULE_CARDS: RuleCard[] = [
  {
    title: "Siempre",
    tone: "green",
    rules: [
      "El sábado (tirada larga o caminata) es el eje de la semana.",
      "Aumentá distancia o velocidad, nunca las dos juntas.",
      "Hidratate bien los 2 días antes de cada esfuerzo largo.",
      "Llegá cansado a los eventos, no destruido.",
      "Priorizá el piso de 150g de proteína, sobre todo antes de la cena.",
    ],
  },
  {
    title: "Nunca",
    tone: "orange",
    rules: [
      "Piernas pesadas en el gym la semana de un evento.",
      "Esfuerzo fuerte dos días seguidos.",
      "Estrenar calzado el día de un evento.",
      "Ignorar dolor articular — cansancio no es lo mismo que lesión.",
    ],
  },
  {
    title: "Luján — clave",
    tone: "purple",
    rules: [
      "Salí con ritmo conservador, es un esfuerzo de un día entero.",
      "Hidratación y sales constantes, no solo agua.",
      "Calzado ya probado en caminatas largas previas.",
      "Semana previa: piernas frescas, nada de carga pesada.",
      "Semana posterior: recuperación real, no hay apuro.",
    ],
  },
  {
    title: "Señales de alarma",
    tone: "pink",
    rules: [
      "Dolor articular +48hs → bajá volumen esa semana.",
      "Varias noches de mal sueño → señal de sobreentrenamiento.",
      "Perdés +2 semanas por lesión → ajustá el plan, no fuerces volumen.",
    ],
  },
];
