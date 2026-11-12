// Ex scripts/check-calorie-target.mjs.
import { describe, expect, it } from "vitest";
import {
  calcularMeta,
  computeBmrCalibrado,
  deficitDeFase,
  type UserProfile,
} from "@/lib/calorie-target";

const base = { edad: 30, alturaCm: 180, factorActividad: 1.55 };
const hombre: UserProfile = { ...base, sexo: "M" };
const mujer: UserProfile = { ...base, sexo: "F" };

describe("calorías", () => {
  it("Mifflin-St Jeor: 10·peso + 6.25·altura − 5·edad, +5 hombre / −161 mujer", () => {
    expect(computeBmrCalibrado(80, hombre)).toBe(1780);
    expect(computeBmrCalibrado(80, mujer)).toBe(1614);
  });

  it("calibración (ej. InBody): a ese peso da lo medido y a otro escala con el mismo factor", () => {
    // 1869 / 1780 = 1.05
    const calibrado = { ...hombre, calibracionPesoKg: 80, calibracionBmrKcal: 1869 };
    expect(computeBmrCalibrado(80, calibrado)).toBe(1869);
    expect(Math.round(computeBmrCalibrado(90, calibrado))).toBe(Math.round(1880 * 1.05));
  });

  it("calibración incompleta (falta uno de los dos datos) = sin calibrar", () => {
    expect(computeBmrCalibrado(80, { ...hombre, calibracionPesoKg: 80 })).toBe(1780);
  });

  it("déficit por fase, y 400 fuera del plan o con una fase desconocida", () => {
    expect(deficitDeFase("p6")).toBe(550);
    expect(deficitDeFase("p5")).toBe(100);
    expect(deficitDeFase(null)).toBe(400);
    expect(deficitDeFase("pX")).toBe(400);
  });

  it("meta del día: BMR + activas − déficit con reloj, BMR × actividad − déficit sin él", () => {
    expect(calcularMeta(80, 500, hombre, "p6")).toEqual({
      meta: 1730,
      gastoCalorico: 2280,
      deficit: 550,
      fuente: "xiaomi",
      pesoKg: 80,
    });
    expect(calcularMeta(80, null, hombre, null)).toEqual({
      meta: Math.round(1780 * 1.55 - 400),
      gastoCalorico: Math.round(1780 * 1.55),
      deficit: 400,
      fuente: "estimado",
      pesoKg: 80,
    });
  });

  it("0 activas cargadas es un dato (día sin actividad), no «sin dato»", () => {
    expect(calcularMeta(80, 0, hombre, "p6").fuente).toBe("xiaomi");
  });
});
