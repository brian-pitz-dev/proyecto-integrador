/** Guía del próximo evento y reglas del plan (se muestran al pie del Calendario). No es dato de Supabase. */

export interface EventCard {
  title: string;
  dateLabel: string;
  paragraphs: { label: string; text: string }[];
}

export const EVENT_CARDS: EventCard[] = [
  {
    title: "Media Maratón 21K — Mar del Plata",
    dateLabel: "Domingo 8 de noviembre 2026",
    paragraphs: [
      { label: "Meta", text: "6:38 min/km (~2:20 total)." },
      {
        label: "Estrategia",
        text: "km 1-3 a 6:45, km 4-16 a 6:35, km 17-21 a 6:30 si vas entero. El reloj marca de más: marcá vuelta en cada cartel oficial de km.",
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
  rules: string[];
}

export const RULE_CARDS: RuleCard[] = [
  {
    title: "Siempre",
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
    rules: [
      "Piernas pesadas en el gym la semana de un evento.",
      "Esfuerzo fuerte dos días seguidos.",
      "Estrenar calzado el día de un evento.",
      "Ignorar dolor articular — cansancio no es lo mismo que lesión.",
    ],
  },
  {
    title: "Señales de alarma",
    rules: [
      "Dolor articular +48hs → bajá volumen esa semana.",
      "Varias noches de mal sueño → señal de sobreentrenamiento.",
      "Perdés +2 semanas por lesión → ajustá el plan, no fuerces volumen.",
    ],
  },
];
