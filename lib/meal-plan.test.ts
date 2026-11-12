// Ex scripts/check-meal-scaling.mjs: escalado de porciones y umbral de proteína.
import { describe, expect, it } from "vitest";
import {
  getMealsForDay,
  mealBank,
  portionFactor,
  umbralAlmuerzo,
  type Meal,
  type MealBank,
  type MealType,
} from "@/lib/meal-plan";

const carbLoad = [5, 6, 12];

describe("plan de comidas", () => {
  it("sin opts = banco base explícito (el plan original no cambia)", () => {
    for (let w = 1; w <= 30; w++)
      for (let d = 0; d < 7; d++)
        expect(getMealsForDay(w, d, carbLoad)).toEqual(
          getMealsForDay(w, d, carbLoad, { bank: mealBank }),
        );
  });

  it("factor de porción acotado a [0.75, 1.3] y redondeado", () => {
    expect(portionFactor(5000, 1000)).toBe(1.3);
    expect(portionFactor(100, 1000)).toBe(0.75);
    expect(portionFactor(2200, 2000)).toBe(1.1);
    expect(portionFactor(2000, 0)).toBe(1);
  });

  it("umbral de proteína del almuerzo: 55 g a 94.9 kg (el plan original), menos con menos peso", () => {
    expect(umbralAlmuerzo(94.9)).toBe(55);
    expect(umbralAlmuerzo(null)).toBe(55);
    expect(umbralAlmuerzo(70)).toBeLessThan(55);
  });

  it("con meta: huevos de a 50 g y, si el factor no topó, el total queda a ≤10% de la meta", () => {
    for (let w = 1; w <= 40; w++)
      for (let d = 0; d < 5; d++)
        for (const meta of [1900, 2300, 2600, 3000]) {
          const scaled = getMealsForDay(w, d, carbLoad, { metaKcal: meta, pesoKg: 94.9 });
          expect(scaled.factor).toBeGreaterThanOrEqual(0.75);
          expect(scaled.factor).toBeLessThanOrEqual(1.3);
          for (const m of scaled.meals)
            for (const i of m.meal.ingredientes)
              if (i.id === "huevoFrito") expect((i.cantidad ?? 0) % 50).toBe(0);
          if (scaled.factor > 0.75 && scaled.factor < 1.3)
            expect(
              Math.abs(scaled.totalKcal - meta) / meta,
              `semana ${w} día ${d} meta ${meta}`,
            ).toBeLessThanOrEqual(0.1);
        }
  });

  it("banco propio (IA): los totales estimados escalan con el factor", () => {
    const iaMeal = (name: string): Meal => ({
      name,
      detail: "",
      proteinG: 60, // ≥ umbral: sin refuerzo, así el factor no se corrige
      kcal: 500,
      ingredientes: [{ id: "ia", nombre: "lentejas", cantidad: 200 }],
      carbLoad: true,
    });
    const tipos: MealType[] = ["desayuno", "media", "almuerzo", "merienda", "cena"];
    const iaBank = Object.fromEntries(
      tipos.map((t) => [t, [iaMeal(`${t} 1`), iaMeal(`${t} 2`)]]),
    ) as MealBank;

    const ia = getMealsForDay(1, 0, [], { bank: iaBank, metaKcal: 3000 });
    expect(ia.factor).toBe(1.2);
    const almuerzo = ia.meals.find((m) => m.type === "almuerzo");
    expect(almuerzo?.meal.ingredientes[0].cantidad).toBe(240);
    expect(almuerzo?.proteinG).toBe(72);
  });
});
