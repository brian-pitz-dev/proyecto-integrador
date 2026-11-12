/** Fecha local en formato ISO YYYY-MM-DD (no usar toISOString(): convierte a UTC y desfasa el día). */
export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Inversa de toISO: fecha local a partir de YYYY-MM-DD (no usar `new Date(iso)`: lo interpreta como UTC). */
export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Años cumplidos a `hoy` para una fecha de nacimiento YYYY-MM-DD. */
export function edadDesde(fechaNacimiento: string, hoy: Date = todayNormalized()): number {
  const n = fromISO(fechaNacimiento);
  const cumplioEsteAnio =
    hoy.getMonth() > n.getMonth() ||
    (hoy.getMonth() === n.getMonth() && hoy.getDate() >= n.getDate());
  return hoy.getFullYear() - n.getFullYear() - (cumplioEsteAnio ? 0 : 1);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Lunes de la semana que contiene `d` (portado de plan_vida_2026.html). */
export function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Hoy a las 00:00, según la fecha de Buenos Aires: en el server (UTC) `new Date()` ya es mañana después de las 21 h. */
export function todayNormalized(): Date {
  return fromISO(
    new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }),
  );
}

export const MONTHS_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export const WEEKDAY_LABELS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export function formatShort(d: Date): string {
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;
}
