/** Portado de plan_vida_2026.html: formatPace. */

export function formatPace(secPerKm: number): string {
  let min = Math.floor(secPerKm / 60);
  let sec = Math.round(secPerKm % 60);
  if (sec === 60) {
    min += 1;
    sec = 0;
  }
  return `${min}:${sec.toString().padStart(2, "0")}/km`;
}

/** Extrae el ritmo en segundos/km de una nota tipo "1:15:30 · 5:30/km". */
export function paceStrToSeconds(nota: string | null): number | null {
  if (!nota) return null;
  const m = nota.match(/(\d+):(\d+)\/km/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
