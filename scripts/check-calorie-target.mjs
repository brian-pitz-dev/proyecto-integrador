// Self-check del cálculo de calorías (no hay test suite).
// Correr con: npx tsx scripts/check-calorie-target.mjs   (tsx resuelve los alias "@/" de tsconfig)
import assert from "node:assert/strict";
import { calcularMeta, computeBmrCalibrado, deficitDeFase } from "../lib/calorie-target.ts";

const base = { edad: 30, alturaCm: 180, factorActividad: 1.55 };
const hombre = { ...base, sexo: "M" };
const mujer = { ...base, sexo: "F" };

// 1. Mifflin-St Jeor: 10·peso + 6.25·altura − 5·edad, +5 hombre / −161 mujer.
assert.equal(computeBmrCalibrado(80, hombre), 1780);
assert.equal(computeBmrCalibrado(80, mujer), 1614);

// 2. Calibración (ej. InBody): con la medición de 80 kg → 1869 kcal, a ese peso da exactamente lo
// medido, y a otro peso escala con el mismo factor (1869 / 1780 = 1.05).
const calibrado = { ...hombre, calibracionPesoKg: 80, calibracionBmrKcal: 1869 };
assert.equal(computeBmrCalibrado(80, calibrado), 1869);
assert.equal(Math.round(computeBmrCalibrado(90, calibrado)), Math.round(1880 * 1.05));

// 3. Calibración incompleta (falta uno de los dos datos) = sin calibrar.
assert.equal(computeBmrCalibrado(80, { ...hombre, calibracionPesoKg: 80 }), 1780);

// 4. Déficit por fase, y 400 fuera del plan o con una fase desconocida.
assert.equal(deficitDeFase("p6"), 550);
assert.equal(deficitDeFase("p5"), 100);
assert.equal(deficitDeFase(null), 400);
assert.equal(deficitDeFase("pX"), 400);

// 5. Meta del día: con calorías activas cargadas = BMR + activas − déficit ("xiaomi");
// sin ellas = BMR × factor de actividad − déficit ("estimado").
assert.deepEqual(calcularMeta(80, 500, hombre, "p6"), {
  meta: 1730,
  gastoCalorico: 2280,
  deficit: 550,
  fuente: "xiaomi",
  pesoKg: 80,
});
assert.deepEqual(calcularMeta(80, null, hombre, null), {
  meta: Math.round(1780 * 1.55 - 400),
  gastoCalorico: Math.round(1780 * 1.55),
  deficit: 400,
  fuente: "estimado",
  pesoKg: 80,
});
// 0 activas cargadas es un dato (día sin actividad), no "sin dato"
assert.equal(calcularMeta(80, 0, hombre, "p6").fuente, "xiaomi");

console.log("check-calorie-target: OK");
