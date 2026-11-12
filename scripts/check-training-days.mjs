// Self-check de la adaptación del plan a días/minutos del usuario (spec 006; no hay test suite).
// Correr con: npx tsx scripts/check-training-days.mjs   (tsx resuelve los alias "@/" de tsconfig)
import assert from "node:assert/strict";
import { buildPlan } from "../lib/training-plan.ts";
import { fromISO } from "../lib/date.ts";

const today = fromISO("2026-11-12");
const events = [
  { id: "a", tipo: "carrera", nombre: "10K", fecha: "2026-12-20", distanciaKm: 10 },
  { id: "b", tipo: "caminata", nombre: "Caminata", fecha: "2027-01-24", distanciaKm: 60 },
  { id: "c", tipo: "carrera", nombre: "21K", fecha: "2027-03-14", distanciaKm: 21.1 },
];
const plan = (disp) => buildPlan("2026-11-09", events, today, disp);
const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const entrena = (cfg, d) => (cfg[days[d]] ?? []).some((s) => s.tag !== "rest");

// 1. Los días de la plantilla (o todos) con 60'+ dan exactamente el plan de siempre.
const base = buildPlan("2026-11-09", events, today);
for (const disp of [
  { dias: [0, 1, 2, 3, 4, 5], minutos: 60 },
  { dias: [0, 1, 2, 3, 4, 5, 6], minutos: 90 },
])
  assert.deepEqual(plan(disp), base);

// 2. Nunca se entrena fuera de los días elegidos, ni más sesiones que días.
for (const dias of [[5], [1, 5], [0, 2, 5], [1, 3, 6], [0, 1, 3, 5], [2, 3, 4, 5, 6]]) {
  for (const w of plan({ dias, minutos: 60 })) {
    for (let d = 0; d < 7; d++) if (entrena(w.cfg, d)) assert.ok(dias.includes(d), `${w.num} ${d}`);
    // 3. Si la plantilla tenía salida larga, sobrevive (es la de mayor prioridad).
    const teniaLarga = Object.values(base[w.num - 1].cfg).some((ss) =>
      (ss ?? []).some((s) => s.tag === "long" || s.tag === "walk"),
    );
    const tieneLarga = Object.values(w.cfg).some((ss) =>
      (ss ?? []).some((s) => s.tag === "long" || s.tag === "walk"),
    );
    assert.equal(tieneLarga, teniaLarga, `semana ${w.num} con días ${dias}`);
  }
}

// 4. Antes de un evento, con 3 días correr le gana al gym (p1: larga + 2 cardio, sin gym).
const p1 = plan({ dias: [1, 3, 5], minutos: 60 }).find((w) => w.phaseKey === "p1");
const tags = Object.values(p1.cfg).flatMap((ss) => (ss ?? []).map((s) => s.tag));
assert.ok(!tags.includes("gym") && tags.includes("long") && tags.includes("run"), tags.join());

// 5. En mantenimiento, con pocos días el gym rota entre rutinas en vez de repetir siempre la misma.
const keys = new Set(
  plan({ dias: [0, 2, 5], minutos: 60 })
    .filter((w) => w.phaseKey === "p6")
    .flatMap((w) => Object.values(w.cfg).flatMap((ss) => (ss ?? []).map((s) => s.gymKey)))
    .filter(Boolean),
);
assert.ok(keys.size >= 2, [...keys].join());

// 6. Con 30': una sola sesión por día y rutinas de 3 ejercicios; con 45', de 4.
for (const [minutos, tope] of [
  [30, 3],
  [45, 4],
]) {
  for (const w of plan({ dias: [0, 1, 2, 3, 4, 5], minutos })) {
    for (const ss of Object.values(w.cfg)) {
      assert.ok((ss ?? []).length <= 1);
      for (const s of ss ?? [])
        if (s.tag === "gym" || s.tag === "core") assert.equal(s.maxEjercicios, tope);
    }
  }
}

// 7. Un plan que arranca un jueves igual tiene semanas de lunes a domingo (mon = lunes real).
const jueves = buildPlan("2026-11-12", events, today, { dias: [1, 3, 5], minutos: 30 });
assert.equal(jueves[0].start, "2026-11-09");
assert.equal(fromISO(jueves[0].start).getDay(), 1);

console.log("check-training-days: OK");
