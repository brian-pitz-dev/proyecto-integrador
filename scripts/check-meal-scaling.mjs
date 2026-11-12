// Self-check del escalado de porciones y el umbral de proteína (no hay test suite).
// Correr con: node scripts/check-meal-scaling.mjs   (Node >= 23: importa .ts directo)
import assert from "node:assert/strict";
import { getMealsForDay, mealBank, portionFactor, umbralAlmuerzo } from "../lib/meal-plan.ts";

const carbLoad = [5, 6, 12];

// 1. Sin opts = banco base explícito (el plan original no cambia).
for (let w = 1; w <= 30; w++)
  for (let d = 0; d < 7; d++)
    assert.deepEqual(
      getMealsForDay(w, d, carbLoad),
      getMealsForDay(w, d, carbLoad, { bank: mealBank }),
    );

// 2. Factor acotado y redondeado.
assert.equal(portionFactor(5000, 1000), 1.3);
assert.equal(portionFactor(100, 1000), 0.75);
assert.equal(portionFactor(2200, 2000), 1.1);
assert.equal(portionFactor(2000, 0), 1);

// 3. Umbral: a 94.9 kg (peso inicial de Brian) da los 55 g originales.
assert.equal(umbralAlmuerzo(94.9), 55);
assert.equal(umbralAlmuerzo(null), 55);
assert.ok(umbralAlmuerzo(70) < 55);

// 4. Con meta: huevos de a 50 g y, si el factor no topó, el total (refuerzo incluido) queda a ≤10% de la meta.
for (let w = 1; w <= 40; w++)
  for (let d = 0; d < 5; d++)
    for (const meta of [1900, 2300, 2600, 3000]) {
      const scaled = getMealsForDay(w, d, carbLoad, { metaKcal: meta, pesoKg: 94.9 });
      assert.ok(scaled.factor >= 0.75 && scaled.factor <= 1.3);
      for (const m of scaled.meals)
        for (const i of m.meal.ingredientes)
          if (i.id === "huevoFrito") assert.equal(i.cantidad % 50, 0);
      if (scaled.factor > 0.75 && scaled.factor < 1.3)
        assert.ok(
          Math.abs(scaled.totalKcal - meta) / meta <= 0.1,
          `semana ${w} día ${d} meta ${meta}`,
        );
    }

// 5. Banco propio (IA): totales estimados escalan con el factor.
const iaMeal = (name) => ({
  name,
  detail: "",
  proteinG: 60, // ≥ umbral: sin refuerzo, así el factor no se corrige
  kcal: 500,
  ingredientes: [{ id: "ia", nombre: "lentejas", cantidad: 200 }],
  carbLoad: true,
});
const iaBank = Object.fromEntries(
  ["desayuno", "media", "almuerzo", "merienda", "cena"].map((t) => [
    t,
    [iaMeal(`${t} 1`), iaMeal(`${t} 2`)],
  ]),
);
const ia = getMealsForDay(1, 0, [], { bank: iaBank, metaKcal: 3000 });
assert.equal(ia.factor, 1.2);
const almuerzo = ia.meals.find((m) => m.type === "almuerzo");
assert.equal(almuerzo.meal.ingredientes[0].cantidad, 240);
assert.equal(almuerzo.proteinG, 72);

console.log("check-meal-scaling: OK");
