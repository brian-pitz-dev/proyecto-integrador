/** Portado de plan_vida_2026.html: parseTimeToSeconds / formatPace. */

export function parseTimeToSeconds(t: string): number {
  const parts = t.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return NaN;
}

export function formatPace(secPerKm: number): string {
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, "0")}/km`;
}

/** Extrae el ritmo en segundos/km de una nota tipo "1:15:30 · 5:30/km". */
export function paceStrToSeconds(nota: string | null): number | null {
  if (!nota) return null;
  const m = nota.match(/(\d+):(\d+)\/km/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
