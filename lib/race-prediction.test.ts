import { describe, expect, it } from "vitest";
import { esfuerzosDe, predecirCarrera, riegel } from "@/lib/race-prediction";
import { formatDuracion } from "@/lib/pace";
import { fromISO } from "@/lib/date";
import type { Registro } from "@/lib/types";

const hoy = fromISO("2026-11-12");
const tirada = (fecha: string, km: number, nota: string | null): Registro => ({
  id: fecha,
  categoria: "tirada",
  fecha,
  valor: km,
  nota,
});

describe("predicción de carrera", () => {
  it("Riegel: 10K en 50:00 da un 21K en ~1:50:20", () => {
    expect(formatDuracion(riegel(50 * 60, 10, 21.1))).toBe("1:50:20");
    expect(riegel(1800, 5, 5)).toBe(1800);
  });

  it("lee km y ritmo de tiradas y eventos, y descarta caminatas y notas sin ritmo", () => {
    const esfuerzos = esfuerzosDe([
      tirada("2026-11-01", 10, "50min · 5:00/km"),
      { ...tirada("2026-11-02", 21.1, "Media · 1h 55min · 5:27/km"), categoria: "evento" },
      tirada("2026-11-03", 8, "1h 30min · 11:15/km"), // caminando
      tirada("2026-11-04", 5, null),
      tirada("2026-11-05", 0, "0min · 5:00/km"),
    ]);
    expect(esfuerzos).toEqual([
      { fecha: "2026-11-01", km: 10, seg: 3000 },
      { fecha: "2026-11-02", km: 21.1, seg: 327 * 21.1 },
    ]);
  });

  it("usa la mejor predicción entre corridas recientes y largas", () => {
    const esfuerzos = [
      { fecha: "2026-11-01", km: 10, seg: 3000 }, // 21K → 1:50:20
      { fecha: "2026-11-05", km: 12, seg: 12 * 330 }, // 21K → más lento
      { fecha: "2026-08-01", km: 10, seg: 2400 }, // muy rápida, pero de hace más de 60 días
      { fecha: "2026-11-10", km: 4, seg: 4 * 240 }, // muy corta para un 21K (< 1/4)
      { fecha: "2026-11-20", km: 10, seg: 2400 }, // futura (fecha mal cargada)
    ];
    const p = predecirCarrera(esfuerzos, 21.1, hoy);
    expect(p?.base.fecha).toBe("2026-11-01");
    expect(formatDuracion(p!.seg)).toBe("1:50:20");
  });

  it("sin corridas que sirvan no predice", () => {
    expect(predecirCarrera([], 10, hoy)).toBeNull();
    expect(predecirCarrera([{ fecha: "2026-11-01", km: 2, seg: 600 }], 10, hoy)).toBeNull();
  });

  it("formatDuracion: mm:ss abajo de una hora", () => {
    expect(formatDuracion(48 * 60 + 5)).toBe("48:05");
    expect(formatDuracion(3600)).toBe("1:00:00");
  });
});
