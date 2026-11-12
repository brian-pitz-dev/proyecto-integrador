/**
 * Motor de plan de entrenamiento — generaliza plan_vida_2026.html a múltiples
 * usuarios: las fechas de cada fase se calculan relativas a los propios
 * eventos de cada usuario (buildPlan), no a un calendario fijo. El contenido
 * de cada fase (phase1Week..phase6Week) es la misma plantilla para todos —
 * ver specs/004-multi-user-onboarding/spec.md, sección de Asunciones.
 */

import { toISO, fromISO, addDays, isSameDay } from "@/lib/date";
import { formatPace } from "@/lib/pace";

export type SessionTag = "core" | "run" | "gym" | "long" | "walk" | "rest" | "event" | "luj";

export interface Session {
  tag: SessionTag;
  label: string;
  detail?: string;
  gymKey?: string;
  coreKey?: "base" | "light";
  /** Tope de ejercicios de la rutina cuando el usuario tiene poco tiempo por sesión. */
  maxEjercicios?: number;
}

/** Cuándo puede entrenar el usuario: días 0 = lunes … 6 = domingo, y minutos por sesión. */
export interface Disponibilidad {
  dias: number[];
  minutos: number;
}

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type WeekConfig = Record<DayKey, Session[] | null>;

export interface UserEvent {
  id: string;
  tipo: "carrera" | "caminata";
  nombre: string;
  fecha: string; // ISO YYYY-MM-DD
  distanciaKm: number;
  /** Ritmo objetivo de carrera en segundos por km (opcional, lo carga el usuario). */
  ritmoObjetivoSeg?: number | null;
  etiqueta?: string | null;
  detalle?: string | null;
}

interface Ritmos {
  /** Ritmo de carrera, para "a ${rc}". */
  rc: string;
  /** Ritmo de series (~10% más rápido que el de carrera). */
  series: string;
}

/** Ritmos de las sesiones previas a una carrera larga: del ritmo objetivo del evento, o en texto si no lo cargó. */
function ritmosDe(ev: UserEvent): Ritmos {
  const seg = ev.ritmoObjetivoSeg;
  if (!seg) {
    return {
      rc: "ritmo de carrera",
      series: "ritmo de series (algo más rápido que el de carrera)",
    };
  }
  // 0.905: con el 6:38 de Brian da exactamente sus 6:00 de series de siempre
  return { rc: formatPace(seg), series: formatPace(Math.round(seg * 0.905)) }; // "6:38/km"
}

function core(short: boolean): Session {
  return {
    tag: "core",
    label: "Core en casa",
    coreKey: short ? "light" : "base",
  };
}

function cardioSession(desc: string, label = "Cinta / Cardio"): Session {
  return { tag: "run", label, detail: desc };
}

function gymSession(key: string, withCore?: boolean): Session[] {
  const arr: Session[] = [{ tag: "gym", label: "Gym", gymKey: key }];
  if (withCore) arr.push(core(key.includes("Light")));
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
    "18 km caminando, probá el calzado/hidratación de tu caminata",
    "10 km caminando muy suave — descarga, piernas frescas para el sábado siguiente",
  ];
  return {
    mon: gymSession("empuje", true),
    tue: [cardioSession("5.5 km/h con inclinación 8-10% · 40 min · caminata en cinta")],
    wed: gymSession(n === 3 ? "inferiorLight" : "inferior", true),
    thu: [cardioSession("5.5 km/h con inclinación 8-10% · 40 min · caminata en cinta")],
    fri: n === 3 ? gymSession("tironLight", true) : gymSession("tiron", true),
    sat: [longSession("Caminata larga — prep", walks[n - 1], "long")],
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

function phase4Week(n: number, { rc: RC, series: SERIES }: Ritmos): WeekConfig {
  const piernas = [
    { gymKey: "inferiorRun", detail: "10' de cinta + piernas · esta semana 2×8, moderado" },
    { gymKey: "inferiorRun", detail: "10' de cinta + piernas pesadas" },
    { gymKey: "inferiorLight", detail: "10' de cinta + última sesión de piernas" },
  ];
  const series = [
    `35' suave (7:30-7:45) + 4 aceleraciones de 20"`,
    `10' suave + 5×1 km a ${SERIES} (2' trote) + 10' suave`,
    `10' suave + 4×1 km a ${SERIES} (2' trote) + 10' suave`,
  ];
  const casa = [
    "Peso muerto rumano 2×8 + gemelos a una pierna 2×12",
    "Peso muerto rumano 3×8 + gemelos a una pierna 3×12",
    "Gemelos a una pierna 2×12",
  ];
  const thu = [
    "Mañana, en el gym: cinta al 1% · 10' de entrada en calor · 5 km parejo al máximo · 10' de vuelta a la calma. Anotá el tiempo.",
    `10' suave + 2×4 km a ${RC} (3' trote) + 5' suave`,
    `10' suave + 5 km a ${RC} + 5' suave`,
  ];
  const sat = [
    `13 km: 11 suave + 2 a ${RC}`,
    `16 km a las 7-8 h: 8 suave + 6 a ${RC} + 2 suave · desayuno 3 h antes, geles a los 45' y 90', ropa y zapatillas de carrera`,
    `12 km: 6 suave + 6 a ${RC}`,
  ];
  const cinta = (min: number) => `Caminata inclinada ${min}' · 5.5 km/h · 8-10%`;
  return {
    mon: [cardioSession(cinta(n === 2 ? 55 : 50)), core(false)],
    tue: [
      { tag: "gym", label: "Gym", ...piernas[n - 1] },
      cardioSession(series[n - 1], "Correr afuera"),
      { tag: "core", label: "Casa — mancuernas", detail: casa[n - 1] },
    ],
    wed: [cardioSession(cinta([50, 55, 45][n - 1])), core(n === 3)],
    thu: [cardioSession(thu[n - 1], n === 1 ? "TEST 5K" : "Ritmo de carrera — afuera")],
    fri: [restDay(n === 2 ? "Descanso — cena con carbohidratos (ensayo)" : undefined)],
    sat: [longSession(n === 2 ? "ENSAYO GENERAL" : "Tirada larga", sat[n - 1])],
    sun: [restDay()],
  };
}

function phase5Week({ rc: RC }: Ritmos): WeekConfig {
  return {
    mon: [cardioSession("Caminata suave 30' · 5 km/h · 3-5% · sin pesas"), core(true)],
    tue: [cardioSession(`10' suave + 3×1 km a ${RC} (2' trote) + 10' suave`, "Correr afuera")],
    wed: [cardioSession("Caminata suave 30' · 5 km/h")],
    thu: [cardioSession(`25' suave + 3 aceleraciones de 20"`, "Correr afuera")],
    fri: [restDay("Descanso — carga de carbohidratos (jueves a sábado)")],
    sat: [
      longSession(
        "Activación",
        "15' trote suave + 3 aceleraciones · retirar kit y preparar ropa",
        "run",
      ),
    ],
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

const dowKeys: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/** Fases que preparan un evento: al recortar días, correr pesa más que el gym. */
const FASES_EVENTO = new Set(["p1", "p2", "p4", "p5"]);

/** Menor = más importante. La salida larga siempre primero; gym empata con correr fuera de las fases de evento. */
function prioridad(s: Session, phaseKey: string): number {
  if (s.tag === "long" || s.tag === "walk" || s.tag === "event" || s.tag === "luj") return 0;
  if (s.tag === "run") return 1;
  if (s.tag === "gym") return FASES_EVENTO.has(phaseKey) ? 2 : 1;
  if (s.tag === "core") return 3;
  return 9;
}

/**
 * Adapta una semana de la plantilla a los días y minutos del usuario (spec 006, research.md):
 * 1. se quedan las sesiones más prioritarias que entran en sus días (a igual prioridad, rota
 *    según la semana para no repetir siempre la misma rutina de gym);
 * 2. se reparten en sus días conservando el orden de la semana y moviéndolas lo menos posible;
 * 3. con menos de 60', cada día queda con su sesión principal y la rutina con menos ejercicios.
 * Con los días de la plantilla y 60' o más devuelve la semana tal cual.
 */
export function adaptWeek(
  cfg: WeekConfig,
  phaseKey: string,
  weekNum: number,
  disp: Disponibilidad,
): WeekConfig {
  const dias = [...new Set(disp.dias)].sort((a, b) => a - b);
  const slots = dowKeys.flatMap((dk, day) => {
    const sessions = (cfg[dk] ?? []).filter((s) => s.tag !== "rest");
    if (!sessions.length) return [];
    return [{ day, sessions, prio: Math.min(...sessions.map((s) => prioridad(s, phaseKey))) }];
  });
  if (disp.minutos >= 60 && slots.every((s) => dias.includes(s.day))) return cfg;

  const grupos = new Map<number, typeof slots>();
  for (const s of slots) grupos.set(s.prio, [...(grupos.get(s.prio) ?? []), s]);
  const elegidos = [...grupos.keys()]
    .sort((a, b) => a - b)
    .flatMap((p) => {
      const g = grupos.get(p)!;
      const r = weekNum % g.length;
      return [...g.slice(r), ...g.slice(0, r)];
    })
    .slice(0, dias.length)
    .sort((a, b) => a.day - b.day);

  // costo[i][j]: mínimo corrimiento total ubicando las primeras i sesiones en los primeros j días, en orden
  const n = elegidos.length;
  const m = dias.length;
  const dist = (i: number, j: number) => Math.abs(elegidos[i - 1].day - dias[j - 1]);
  const costo = Array.from({ length: n + 1 }, (_, i) =>
    Array<number>(m + 1).fill(i === 0 ? 0 : Infinity),
  );
  for (let i = 1; i <= n; i++)
    for (let j = i; j <= m; j++)
      costo[i][j] = Math.min(costo[i][j - 1], costo[i - 1][j - 1] + dist(i, j));
  const asignado = new Map<number, Session[]>();
  for (let i = n, j = m; i > 0; j--) {
    if (costo[i][j] === costo[i - 1][j - 1] + dist(i, j)) {
      asignado.set(dias[j - 1], elegidos[i - 1].sessions);
      i--;
    }
  }

  const tope = disp.minutos <= 30 ? 3 : 4;
  const recortar = (sessions: Session[]): Session[] => {
    if (disp.minutos >= 60) return sessions;
    const [principal] = [...sessions].sort(
      (a, b) => prioridad(a, phaseKey) - prioridad(b, phaseKey),
    );
    const conRutina = principal.tag === "gym" || principal.tag === "core";
    return [conRutina ? { ...principal, maxEjercicios: tope } : principal];
  };

  return Object.fromEntries(
    dowKeys.map((dk, day) => {
      const s = asignado.get(day);
      if (s) return [dk, recortar(s)];
      const original = cfg[dk];
      // los descansos con texto propio (ej. carga de carbohidratos) se conservan en su día
      return [
        dk,
        original == null || original.every((x) => x.tag === "rest") ? original : [restDay()],
      ];
    }),
  ) as WeekConfig;
}

function genericLabel(e: UserEvent): string {
  return e.tipo === "carrera" ? `CARRERA — ${e.nombre}` : `CAMINATA — ${e.nombre}`;
}

function genericDetail(e: UserEvent): string {
  return `${e.distanciaKm} km · Ritmo conservador los primeros km, después soltá según sensaciones.`;
}

function eventOverrideFor(events: UserEvent[], date: Date): { sessions: Session[] } | null {
  const ev = events.find((e) => isSameDay(fromISO(e.fecha), date));
  if (!ev) return null;
  return {
    sessions: [
      {
        tag: ev.tipo === "carrera" ? "event" : "luj",
        label: ev.etiqueta ?? genericLabel(ev),
        detail: ev.detalle ?? genericDetail(ev),
      },
    ],
  };
}

export interface Week {
  num: number;
  /** ISO YYYY-MM-DD — no `Date`: cruzar un `Date` de Server a Client Component lo reinterpreta en el timezone del navegador y desfasa el día (ver lib/date.ts fromISO). */
  start: string;
  phaseKey: string;
  phaseLabel: string;
  cfg: WeekConfig;
  /** La semana contiene la fecha de un evento del usuario. */
  isEventWeek: boolean;
  /** La semana es la inmediata anterior a una semana de evento. */
  isPrepWeek: boolean;
}

interface RawWeek {
  num: number;
  start: Date;
  phaseKey: string;
  phaseLabel: string;
  cfg: WeekConfig;
}

/** Umbral de distancia que distingue un bloque de carrera "corto" (sin taper, ideal 4 semanas) de uno "largo" (construcción + taper, ideal 3+1 semanas) — separa el 10K del 21K en los datos históricos. */
const CARRERA_LARGA_KM = 15;

function weeksAvailableBetween(cursor: Date, eventDate: Date): number {
  const days = Math.round((eventDate.getTime() - cursor.getTime()) / 86_400_000);
  return Math.max(1, Math.ceil(days / 7));
}

/** Empuja `count` semanas de contenido `fn(n)` para n=1..count, avanzando cursor/wnum. */
function pushContentWeeks(
  out: RawWeek[],
  cursor: { d: Date },
  wnumRef: { n: number },
  count: number,
  fn: (n: number) => WeekConfig,
  startN: number,
  phaseKey: string,
  phaseLabel: string,
): void {
  for (let i = 0; i < count; i++) {
    out.push({
      num: wnumRef.n,
      start: new Date(cursor.d),
      phaseKey,
      phaseLabel,
      cfg: fn(startN + i),
    });
    cursor.d = addDays(cursor.d, 7);
    wnumRef.n++;
  }
}

/** Rellena `weeksAvailable` semanas con contenido `fn`, ideal `ideal` semanas: recorta desde el final si faltan semanas, rellena el frente con mantenimiento si sobran. */
function pushCompressedBlock(
  out: RawWeek[],
  cursor: { d: Date },
  wnumRef: { n: number },
  weeksAvailable: number,
  ideal: number,
  fn: (n: number) => WeekConfig,
  phaseKey: string,
  phaseLabel: string,
): void {
  if (weeksAvailable >= ideal) {
    const padding = weeksAvailable - ideal;
    if (padding > 0) {
      pushContentWeeks(out, cursor, wnumRef, padding, phase6Week, 1, "p6", "FASE — Mantenimiento");
    }
    pushContentWeeks(out, cursor, wnumRef, ideal, fn, 1, phaseKey, phaseLabel);
  } else {
    // menos semanas que el ideal: usar las últimas `weeksAvailable` entradas (las más cercanas al evento)
    const startN = ideal - weeksAvailable + 1;
    pushContentWeeks(out, cursor, wnumRef, weeksAvailable, fn, startN, phaseKey, phaseLabel);
  }
}

/**
 * Arma el plan de un usuario: recorre sus eventos en orden de fecha, un bloque
 * de construcción por evento (según tipo/distancia) + recuperación (salvo
 * carrera seguida inmediatamente de caminata), y mantenimiento abierto después
 * del último evento. Ver specs/004-multi-user-onboarding/ para el resto del
 * razonamiento — reusa el mismo contenido de phase1Week..phase6Week de siempre,
 * solo cambia qué fechas de calendario ocupa cada fase.
 */
export function buildPlan(
  planStartISO: string,
  events: UserEvent[],
  today: Date,
  disp?: Disponibilidad,
): Week[] {
  const sorted = [...events].sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
  const out: RawWeek[] = [];
  // Las semanas arrancan el lunes (de la semana del registro): las claves mon..sun y los días que
  // elige el usuario son días reales de la semana. Antes arrancaban el día del registro y, si no
  // era lunes, "Lun" caía otro día.
  const inicio = fromISO(planStartISO);
  const cursor = { d: addDays(inicio, -((inicio.getDay() + 6) % 7)) };
  const wnum = { n: 1 };

  for (let i = 0; i < sorted.length; i++) {
    const ev = sorted[i];
    const eventDate = fromISO(ev.fecha);
    const weeksAvailable = weeksAvailableBetween(cursor.d, eventDate);
    const eventLabel = `rumbo a ${ev.nombre} (${ev.fecha})`;

    if (ev.tipo === "caminata") {
      pushCompressedBlock(
        out,
        cursor,
        wnum,
        weeksAvailable,
        3,
        phase2Week,
        "p2",
        `FASE — Preparación caminata · ${eventLabel}`,
      );
    } else if (ev.distanciaKm < CARRERA_LARGA_KM) {
      pushCompressedBlock(
        out,
        cursor,
        wnum,
        weeksAvailable,
        4,
        phase1Week,
        "p1",
        `FASE — Construcción · ${eventLabel}`,
      );
    } else {
      // carrera larga: construcción (ideal 3) + taper (ideal 1, nunca se salta salvo weeksAvailable<=1)
      if (weeksAvailable <= 1) {
        pushContentWeeks(
          out,
          cursor,
          wnum,
          1,
          () => phase5Week(ritmosDe(ev)),
          1,
          "p5",
          `FASE — Tapering · última semana antes de ${ev.nombre}`,
        );
      } else {
        pushCompressedBlock(
          out,
          cursor,
          wnum,
          weeksAvailable - 1,
          3,
          (n) => phase4Week(n, ritmosDe(ev)),
          "p4",
          `FASE — Construcción · ${eventLabel}`,
        );
        pushContentWeeks(
          out,
          cursor,
          wnum,
          1,
          () => phase5Week(ritmosDe(ev)),
          1,
          "p5",
          `FASE — Tapering · última semana antes de ${ev.nombre}`,
        );
      }
    }

    const next = sorted[i + 1];
    const skipRecovery = ev.tipo === "carrera" && next?.tipo === "caminata";
    if (!skipRecovery) {
      pushContentWeeks(
        out,
        cursor,
        wnum,
        1,
        phase3Week,
        1,
        "p3",
        `FASE — Recuperación · post ${ev.nombre}`,
      );
    }
  }

  // Mantenimiento abierto tras el último evento (o todo el plan si no hay eventos):
  // siempre cubre al menos 12 semanas por delante de "hoy" para que el calendario
  // nunca se quede corto, recalculado en cada llamada (buildPlan es barato y puro).
  const horizon = addDays(today, 12 * 7);
  const horizonWeeks = Math.ceil((horizon.getTime() - cursor.d.getTime()) / (7 * 86_400_000));
  const maintenanceWeeks = Math.max(horizonWeeks, 4);
  pushContentWeeks(
    out,
    cursor,
    wnum,
    maintenanceWeeks,
    phase6Week,
    1,
    "p6",
    "FASE — Mantenimiento",
  );

  const isoWeeks = out.map((w) => ({
    ...w,
    start: toISO(w.start),
    cfg: disp ? adaptWeek(w.cfg, w.phaseKey, w.num, disp) : w.cfg,
  }));

  function containsEvent(weekStartISO: string): boolean {
    const start = fromISO(weekStartISO);
    const end = addDays(start, 6);
    return events.some((e) => {
      const d = fromISO(e.fecha);
      return d >= start && d <= end;
    });
  }

  return isoWeeks.map((w, i) => ({
    ...w,
    isEventWeek: containsEvent(w.start),
    isPrepWeek: isoWeeks[i + 1] ? containsEvent(isoWeeks[i + 1].start) : false,
  }));
}

/** Clave de fase (p1..p6) vigente para una fecha, usada por getCalorieTarget(). */
export function getPhaseKeyForDate(weeks: Week[], date: Date): string | null {
  const w = weeks.find((wk) => {
    const start = fromISO(wk.start);
    return date >= start && date <= addDays(start, 6);
  });
  return w ? w.phaseKey : null;
}

/** Número de la semana del plan que contiene `today` (o la primera si está fuera del plan). */
export function getCurrentWeekNum(weeks: Week[], today: Date): number {
  const w = weeks.find((wk) => {
    const start = fromISO(wk.start);
    return today >= start && today <= addDays(start, 6);
  });
  return w?.num ?? weeks[0]?.num ?? 1;
}

/** Últimas semanas de "p2"/"p5" vigentes (carga de carbohidratos previa a una caminata/carrera larga). */
export function getCarbLoadWeeks(weeks: Week[]): number[] {
  return ["p2", "p5"]
    .map((key) => weeks.filter((w) => w.phaseKey === key))
    .filter((ws) => ws.length > 0)
    .map((ws) => ws[ws.length - 1].num);
}

/** Equivalente a getSessionsForDate() de plan_vida_2026.html, generalizado por usuario. */
export function getSessionsForDate(weeks: Week[], events: UserEvent[], date: Date): Session[] {
  if (weeks.length === 0) return [restDay()];
  const planStart = fromISO(weeks[0].start);
  if (date < planStart) return [restDay()];

  const override = eventOverrideFor(events, date);
  if (override) return override.sessions;

  const w = weeks.find((wk) => {
    const start = fromISO(wk.start);
    return date >= start && date <= addDays(start, 6);
  });
  if (!w) return [restDay()];
  const di = Math.round((date.getTime() - fromISO(w.start).getTime()) / (1000 * 60 * 60 * 24));
  const dk = dowKeys[di];
  return w.cfg[dk] || [restDay()];
}

/** El próximo evento pendiente (fecha >= `today`), o null si no queda ninguno. */
export function getNextEvent(events: UserEvent[], today: Date): UserEvent | null {
  const upcoming = events
    .filter((e) => fromISO(e.fecha) >= today)
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  return upcoming[0] ?? null;
}
