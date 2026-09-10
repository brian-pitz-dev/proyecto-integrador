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

export function todayNormalized(): Date {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
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

export const DAYS_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function formatShort(d: Date): string {
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;
}
