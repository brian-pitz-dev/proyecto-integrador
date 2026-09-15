/** Portado de plan_vida_2026.html: formatPace. */

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
