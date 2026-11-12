import { describe, expect, it } from "vitest";
import { computeWeightProgress, getMissingYesterdayItems } from "@/lib/stats-summary";
import { fromISO } from "@/lib/date";
import type { Categoria, Registro } from "@/lib/types";

const hoy = fromISO("2026-11-12");
const reg = (categoria: Categoria, fecha: string): Registro => ({
  id: `${categoria}-${fecha}`,
  categoria,
  fecha,
  valor: 1,
  nota: null,
});

describe("computeWeightProgress", () => {
  it("porcentaje del camino entre el primer peso y la meta", () => {
    const p = computeWeightProgress([90, 95, 100], 80, [], hoy);
    expect(p).toMatchObject({ start: 100, current: 90, pct: 50, daysToNextEvent: null });
    expect(p?.diffLabel).toBe("Te faltan 10.0 kg para bajar");
  });

  it("si subió de peso el porcentaje no baja de 0; meta = peso inicial da 100", () => {
    expect(computeWeightProgress([105, 100], 80, [], hoy)?.pct).toBe(0);
    expect(computeWeightProgress([80], 80, [], hoy)?.pct).toBe(100);
    expect(computeWeightProgress([], 80, [], hoy)).toBeNull();
  });

  it("cuenta los días hasta el próximo evento, no los pasados", () => {
    const eventos = [
      { id: "a", tipo: "carrera" as const, nombre: "Pasada", fecha: "2026-10-01", distanciaKm: 10 },
      {
        id: "b",
        tipo: "carrera" as const,
        nombre: "Próxima",
        fecha: "2026-11-22",
        distanciaKm: 21,
      },
    ];
    expect(computeWeightProgress([90], 80, eventos, hoy)?.daysToNextEvent).toBe(10);
  });
});

describe("getMissingYesterdayItems", () => {
  // 12/11 en Buenos Aires (UTC−3): 12 UTC = 9 h, 14 UTC = 11 h
  it("antes de las 10 (hora de Buenos Aires) no avisa", () => {
    expect(getMissingYesterdayItems([], [], new Date(Date.UTC(2026, 10, 12, 12)))).toEqual([]);
  });

  it("después de las 10 avisa lo que falta de ayer", () => {
    const now = new Date(Date.UTC(2026, 10, 12, 14));
    expect(getMissingYesterdayItems([reg("sueno", "2026-11-11")], [], now)).toEqual([
      "calorías de ayer",
    ]);
    expect(getMissingYesterdayItems([], [], now)).toEqual(["sueño de anoche", "calorías de ayer"]);
  });

  it("a las 2 UTC todavía es el día anterior en Buenos Aires", () => {
    // 13/11 02:00 UTC = 12/11 23:00 en BA: "ayer" es el 11
    const now = new Date(Date.UTC(2026, 10, 13, 2));
    const completo = getMissingYesterdayItems(
      [reg("sueno", "2026-11-11")],
      [reg("calorias", "2026-11-11")],
      now,
    );
    expect(completo).toEqual([]);
  });
});
