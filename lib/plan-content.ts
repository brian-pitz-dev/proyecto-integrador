/** Guía del próximo evento y reglas del plan (se muestran al pie del Calendario). No es dato de Supabase. */

import { formatPace } from "@/lib/pace";
import { fromISO } from "@/lib/date";
import type { UserEvent } from "@/lib/training-plan";

export interface EventCard {
  title: string;
  dateLabel: string;
  paragraphs: { label: string; text: string }[];
}

function duracion(totalSeg: number): string {
  const h = Math.floor(totalSeg / 3600);
  const m = Math.round((totalSeg % 3600) / 60);
  return h ? `${h}h${String(m).padStart(2, "0")}` : `${m} min`;
}

/** Guía para el día de un evento del usuario, armada con su tipo, distancia y ritmo objetivo. */
export function guiaEvento(ev: UserEvent): EventCard {
  const fecha = fromISO(ev.fecha).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const dateLabel = `${fecha[0].toUpperCase()}${fecha.slice(1)} · ${ev.distanciaKm} km`;

  if (ev.tipo === "caminata") {
    return {
      title: ev.nombre,
      dateLabel,
      paragraphs: [
        { label: "Meta", text: "llegar entero: el ritmo importa menos que no lastimarte." },
        {
          label: "Estrategia",
          text: "arrancá más lento de lo que te pide el cuerpo, parás unos minutos cada hora y comés algo antes de tener hambre.",
        },
        {
          label: "Equipo",
          text: "el calzado y las medias que ya probaste en las caminatas largas; nada nuevo el día del evento.",
        },
        {
          label: "Día anterior",
          text: "más carbohidratos de lo habitual, mucha agua y dormir temprano.",
        },
      ],
    };
  }

  const seg = ev.ritmoObjetivoSeg;
  return {
    title: ev.nombre,
    dateLabel,
    paragraphs: [
      {
        label: "Meta",
        text: seg
          ? `${formatPace(seg).replace("/km", " min/km")} (~${duracion(seg * ev.distanciaKm)} total).`
          : "terminar entero y con buenas sensaciones. Si sabés tu ritmo objetivo, cargalo en tu evento.",
      },
      {
        label: "Estrategia",
        text: seg
          ? `el primer 15% unos segundos más lento que ${formatPace(seg)}, el medio parejo a ese ritmo y en el último 20% apretá si vas entero. El reloj suele marcar de más: marcá vuelta en cada cartel oficial de km.`
          : "el primer 15% más lento de lo que te pide el cuerpo, el medio parejo y en el último 20% apretá si vas entero.",
      },
      {
        label: "Día anterior",
        text: "más carbohidratos de lo habitual, proteína normal y nada que no hayas probado antes.",
      },
    ],
  };
}

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
      "Llegá a tu objetivo diario de proteína (lo ves en Nutrición), sobre todo antes de la cena.",
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
