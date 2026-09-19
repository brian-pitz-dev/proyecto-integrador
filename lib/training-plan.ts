/**
 * Plan de entrenamiento semanal — portado 1:1 de plan_vida_2026.html.
 * No es dato de Supabase (Principio IV): vive como constante en el código,
 */

import { toISO } from "@/lib/date";

export type SessionTag = "core" | "run" | "gym" | "long" | "walk" | "rest" | "event" | "luj";

export interface Session {
  tag: SessionTag;
  label: string;
  detail?: string;
  gymKey?: string;
  coreKey?: "base" | "light";
}

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type WeekConfig = Record<DayKey, Session[] | null>;

export const PLAN_START = new Date(2026, 7, 17);
export const PLAN_END = new Date(2026, 11, 31);

const EV_10K = new Date(2026, 8, 13);
const EV_LUJAN = new Date(2026, 9, 3);
const EV_21K = new Date(2026, 10, 8);

export const TARGET_PACE_SEC = 7 * 60 + 30; // 7:30 min/km

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function core(short: boolean): Session {
  return {
    tag: "core",
    label: "Core en casa",
    coreKey: short ? "light" : "base",
  };
}

function cardioSession(desc: string): Session {
  return { tag: "run", label: "Cinta / Cardio", detail: desc };
}

function gymSession(key: string, withCore?: boolean): Session[] {
  const arr: Session[] = [{ tag: "gym", label: "Gym", gymKey: key }];
  if (withCore) arr.push(core(key.includes("Light") || key === "upperOnly"));
  return arr;
}

function longSession(label: string, detail: string, tag?: SessionTag): Session {
  return { tag: tag || "long", label, detail };
}

function restDay(label?: string): Session {
  return { tag: "rest", label: label || "Descanso" };
}

function phase1Week(n: number): WeekConfig {
  const speeds = [
    {
      tue: "8.0 km/h · 30 min continuo",
      thu: "8.0 km/h · 30 min continuo",
      sat: "6 km a ritmo cómodo",
    },
    {
      tue: "10' a 8.0 km/h → 10' a 8.5 km/h → 10' a 9.0 km/h (progresivo)",
      thu: "10' a 8.0 km/h → 10' a 8.5 km/h → 10' a 9.0 km/h (igual)",
      sat: "8 km, últimos 2km a ritmo objetivo",
    },
    {
      tue: "5' a 7 km/h · 5×[2' a 10 km/h / 1' a 7 km/h] · 5' a 7 km/h",
      thu: "Igual que el martes",
      sat: "7 km, mezcla de ritmo cómodo y objetivo",
    },
    { tue: "20 min a 7.5 km/h · activación suave", thu: null, sat: null },
  ];
  const s = speeds[n - 1] as { tue: string; thu: string | null; sat: string | null };
  return {
    mon: gymSession("empuje", true),
    tue: [cardioSession(s.tue)],
    wed: gymSession("inferior", true),
    thu: s.thu ? [cardioSession(s.thu)] : [restDay("Descanso — piernas frescas")],
    fri: gymSession("tiron", true),
    sat: s.sat ? [longSession("Salida", s.sat)] : [restDay("Descanso pre-carrera")],
    sun: [restDay()],
  };
}

function phase2Week(n: number): WeekConfig {
  const walks = [
    "14 km caminando, ritmo conservador",
    "18 km caminando, probá el calzado/hidratación de Luján",
    "10 km caminando muy suave — descarga, piernas frescas para el sábado siguiente",
  ];
  return {
    mon: gymSession("empuje", true),
    tue: [cardioSession("5.5 km/h con inclinación 8-10% · 40 min · caminata en cinta")],
    wed: gymSession(n === 3 ? "inferiorLight" : "inferior", true),
    thu: [cardioSession("5.5 km/h con inclinación 8-10% · 40 min · caminata en cinta")],
    fri: n === 3 ? gymSession("tironLight", true) : gymSession("tiron", true),
    sat: [longSession("Caminata larga — prep Luján", walks[n - 1], "long")],
    sun: [restDay()],
  };
}

function phase3Week(): WeekConfig {
  return {
    mon: [core(true)],
    tue: [cardioSession("5-5.5 km/h · 25 min · caminata suave")],
    wed: gymSession("inferiorLight", true),
    thu: [cardioSession("6.5-7 km/h · 20 min · trote suave, primeras señales de reactivación")],
    fri: gymSession("empujeLight", true),
    sat: [longSession("Trote de reactivación", "8 km, ritmo muy cómodo, sin apuro", "long")],
    sun: [restDay()],
  };
}

function phase4Week(n: number): WeekConfig {
  const runs = [
    "14 km a ritmo cómodo, sin mirar el reloj",
    "17 km, alternando 7:30 min/km con tramos más suaves si hace falta",
    "19 km, simulá la carrera: hidratación cada 5km, caminá si lo necesitás — el objetivo es sumar el kilometraje, no el ritmo",
  ];
  const tuesIntervals = [
    "10' a 7.5 km/h → 15' a 8.0 km/h → 10' a 8.5 km/h",
    "10' a 7.5 km/h → 20' a 8.0 km/h → 10' a 8.5 km/h",
    "10' a 7.5 km/h → 20' a 8.0 km/h → 15' a 8.5 km/h",
  ];
  const thuContinuo = [
    "40 min a 8.0 km/h · continuo",
    "45 min a 8.0 km/h · continuo, últimos 10' a 8.5 km/h",
    "50 min a 8.0 km/h · continuo, últimos 15' a 8.5 km/h",
  ];
  return {
    mon: gymSession("empuje", true),
    tue: [cardioSession(tuesIntervals[n - 1])],
    wed: gymSession("inferior", true),
    thu: [cardioSession(thuContinuo[n - 1])],
    fri: gymSession("tiron", true),
    sat: [longSession("Tirada larga", runs[n - 1])],
    sun: [restDay()],
  };
}

function phase5Week(): WeekConfig {
  return {
    mon: gymSession("empujeLight", true),
    tue: [cardioSession("7.0 km/h · 20 min · suave")],
    wed: [restDay("Descanso — piernas frescas")],
    thu: [cardioSession("6.5-7 km/h · 15 min · activación muy suave")],
    fri: [restDay("Descanso — 2 días antes de la carrera")],
    sat: [restDay("Descanso / preparar ropa y zapatillas")],
    sun: null,
  };
}

function phase6Week(n: number): WeekConfig {
  const cycle = n % 3;
  const runsSat = [
    "8 km, ritmo libre",
    "10 km, ritmo libre",
    "Caminata larga 12 km, ritmo relajado",
  ];
  return {
    mon: gymSession("empuje", true),
    tue: [cardioSession("8.0 km/h · 30-35 min · continuo")],
    wed: gymSession("inferior", true),
    thu: [cardioSession("5' a 7 km/h · 4×[2' a 9.5 km/h / 2' a 7 km/h] · 5' a 7 km/h")],
    fri: gymSession("tiron", true),
    sat: [longSession("Salida de mantenimiento", runsSat[cycle], cycle === 2 ? "walk" : "long")],
    sun: [restDay()],
  };
}

interface PhaseDef {
  key: string;
  label: string;
  desc: string;
  weeks: number;
  fn: (n: number) => WeekConfig;
}

const phaseDefs: PhaseDef[] = [
  {
    key: "p1",
    label: "FASE 1 — Construcción velocidad",
    desc: "Rumbo al 10K del 13/9",
    weeks: 4,
    fn: phase1Week,
  },
  {
    key: "p2",
    label: "FASE 2 — Transición a resistencia",
    desc: "Preparación específica para Luján (3/10)",
    weeks: 3,
    fn: phase2Week,
  },
  {
    key: "p3",
    label: "FASE 3 — Recuperación",
    desc: "Post-Luján, sin apuro",
    weeks: 1,
    fn: phase3Week,
  },
  {
    key: "p4",
    label: "FASE 4 — Construcción 21K",
    desc: "Rumbo al 21K de Mar del Plata (8/11)",
    weeks: 3,
    fn: phase4Week,
  },
  {
    key: "p5",
    label: "FASE 5 — Tapering",
    desc: "Última semana antes del 21K",
    weeks: 1,
    fn: phase5Week,
  },
  {
    key: "p6",
    label: "FASE 6 — Cierre de año",
    desc: "Mantenimiento + foco 100% en composición corporal",
    weeks: 8,
    fn: phase6Week,
  },
];

interface Week {
  num: number;
  start: Date;
  phase: PhaseDef;
  cfg: WeekConfig;
}

const weeks: Week[] = [];
{
  let cursor = new Date(PLAN_START);
  let wnum = 1;
  for (const phase of phaseDefs) {
    for (let i = 1; i <= phase.weeks; i++) {
      const startD = new Date(cursor);
      if (startD > PLAN_END) break;
      const cfg = phase.fn(i);
      weeks.push({ num: wnum, start: startD, phase, cfg });
      cursor = addDays(cursor, 7);
      wnum++;
    }
  }
}

const dowKeys: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function eventOverrideFor(date: Date): { sessions: Session[] } | null {
  if (isSameDay(date, EV_10K)) {
    return {
      sessions: [
        {
          tag: "event",
          label: "CARRERA 10K",
          detail: "Objetivo: menos de 1:00:00 · Salí controlado los primeros 2km, después soltá.",
        },
      ],
    };
  }
  if (isSameDay(date, EV_LUJAN)) {
    return {
      sessions: [
        {
          tag: "luj",
          label: "PROCESIÓN A LUJÁN — 80KM",
          detail: "De un tirón · Ritmo muy conservador · Hidratación constante.",
        },
      ],
    };
  }
  if (isSameDay(date, EV_21K)) {
    return {
      sessions: [
        {
          tag: "event",
          label: "MEDIA MARATÓN 21K — Mar del Plata",
          detail:
            "Objetivo: completarla. 7:30 min/km es un colchón cómodo — caminá los tramos que haga falta, no hay premio por el tiempo.",
        },
      ],
    };
  }
  return null;
}

/** Clave de fase (p1..p6) vigente para una fecha, usada por getCalorieTarget(). */
export function getPhaseKeyForDate(date: Date): string | null {
  const w = weeks.find((wk) => date >= wk.start && date <= addDays(wk.start, 6));
  return w ? w.phase.key : null;
}

export interface PlanWeek {
  num: number;
  /** ISO YYYY-MM-DD — no `Date`: cruzar un `Date` de Server a Client Component lo reinterpreta en el timezone del navegador y desfasa el día (ver lib/date.ts fromISO). */
  start: string;
  phaseKey: string;
  phaseLabel: string;
  /** La semana contiene la fecha de un evento (10K, Luján o 21K). */
  isEventWeek: boolean;
  /** La semana es la inmediata anterior a una semana de evento. */
  isPrepWeek: boolean;
}

/** Semanas del plan (17/ago–31/dic 2026) con marca de evento/preparación, para el selector de semanas (US6). */
export function getWeeks(): PlanWeek[] {
  const eventDates = [EV_10K, EV_LUJAN, EV_21K];

  function containsEvent(w: Week): boolean {
    const wEnd = addDays(w.start, 6);
    return eventDates.some((ev) => ev >= w.start && ev <= wEnd);
  }

  return weeks.map((w, i) => ({
    num: w.num,
    start: toISO(w.start),
    phaseKey: w.phase.key,
    phaseLabel: w.phase.label,
    isEventWeek: containsEvent(w),
    isPrepWeek: weeks[i + 1] ? containsEvent(weeks[i + 1]) : false,
  }));
}

/** Últimas semanas de p2 y p5 (carga de carbohidratos previa a Luján y al 21K). */
export function getCarbLoadWeeks(): number[] {
  return ["p2", "p5"]
    .map((key) => weeks.filter((w) => w.phase.key === key))
    .filter((ws) => ws.length > 0)
    .map((ws) => ws[ws.length - 1].num);
}

export interface PlanEvent {
  name: string;
  date: Date;
}

/** Los 3 eventos del plan (10K, Luján, 21K), para el header y el footer. */
export function getEvents(): PlanEvent[] {
  return [
    { name: "10K", date: EV_10K },
    { name: "Luján", date: EV_LUJAN },
    { name: "21K Mar del Plata", date: EV_21K },
  ];
}

/** El próximo evento pendiente (fecha >= `today`), o null si los 3 ya pasaron. */
export function getNextEvent(today: Date): PlanEvent | null {
  const upcoming = getEvents()
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  return upcoming[0] ?? null;
}

/** Meta de peso/composición del plan, mostrada en el header (portado de plan_vida_2026.html). */
export const PLAN_GOAL = {
  weightKg: 80,
  bodyFatPct: "14-15%",
} as const;

/** Equivalente a getSessionsForDate() de plan_vida_2026.html. */
export function getSessionsForDate(date: Date): Session[] {
  if (date < PLAN_START || date > PLAN_END) return [restDay()];
  const override = eventOverrideFor(date);
  if (override) return override.sessions;
  const w = weeks.find((wk) => date >= wk.start && date <= addDays(wk.start, 6));
  if (!w) return [restDay()];
  const di = Math.round((date.getTime() - w.start.getTime()) / (1000 * 60 * 60 * 24));
  const dk = dowKeys[di];
  return w.cfg[dk] || [restDay()];
}
