/**
 * Plan de comidas — portado 1:1 de plan_vida_2026.html.
 * No es dato de Supabase (Principio IV): vive como constante en el código,
 * igual que lib/training-plan.ts.
 */

import { getWeeks, getCarbLoadWeeks } from "@/lib/training-plan";

export type MealType = "desayuno" | "media" | "almuerzo" | "merienda" | "cena";

export interface Ingrediente {
  id: string;
  cantidad: number | null;
}

export interface Meal {
  name: string;
  detail: string;
  ingredientes: Ingrediente[];
  carbLoad?: boolean;
  liviana?: boolean;
}

export interface DayMeal {
  type: MealType;
  label: string;
  meal: Meal;
  proteinG: number;
}

const mealBank: Record<MealType, Meal[]> = {
  desayuno: [
    {
      name: "3 huevos fritos + café negro",
      detail: "150g (3 huevos), fritos con poco aceite",
      ingredientes: [{ id: "huevoFrito", cantidad: 150 }],
    },
    {
      name: "Avena con leche con proteínas + café",
      detail: "50g avena cocida, 250ml leche con proteínas",
      ingredientes: [
        { id: "avena", cantidad: 50 },
        { id: "lecheProte", cantidad: null },
      ],
    },
    {
      name: "2 huevos fritos + café negro",
      detail: "Rápido, para días con menos tiempo",
      ingredientes: [{ id: "huevoFrito", cantidad: 100 }],
    },
  ],
  media: [
    {
      name: "Batido de proteína + almendras",
      detail: "1 scoop (40g) + 250ml leche con proteínas + 20g almendras",
      ingredientes: [
        { id: "batidoProte", cantidad: null },
        { id: "lecheProte", cantidad: null },
        { id: "almendras", cantidad: 20 },
      ],
    },
    {
      name: "Batido de proteína solo",
      detail: "1 scoop (40g) + 250ml leche con proteínas",
      ingredientes: [
        { id: "batidoProte", cantidad: null },
        { id: "lecheProte", cantidad: null },
      ],
    },
  ],
  almuerzo: [
    {
      name: "Pollo + arroz + espinaca",
      detail: "200g pollo, 150g arroz, 100g espinaca",
      ingredientes: [
        { id: "pollo", cantidad: 200 },
        { id: "arroz", cantidad: 150 },
        { id: "espinaca", cantidad: 100 },
      ],
      carbLoad: false,
    },
    {
      name: "Carne de vaca + papa + espinaca",
      detail: "200g carne, 200g papa, 100g espinaca",
      ingredientes: [
        { id: "carneVaca", cantidad: 200 },
        { id: "papa", cantidad: 200 },
        { id: "espinaca", cantidad: 100 },
      ],
      carbLoad: false,
    },
    {
      name: "Milanesa de carne + fideos integrales + espinaca",
      detail: "200g milanesa al horno, 150g fideos, 100g espinaca",
      ingredientes: [
        { id: "milanesa", cantidad: 200 },
        { id: "fideosInteg", cantidad: 150 },
        { id: "espinaca", cantidad: 100 },
      ],
      carbLoad: true,
    },
    {
      name: "Carne picada + arroz + espinaca",
      detail: "200g carne picada, 150g arroz, 100g espinaca",
      ingredientes: [
        { id: "carnePicada", cantidad: 200 },
        { id: "arroz", cantidad: 150 },
        { id: "espinaca", cantidad: 100 },
      ],
      carbLoad: false,
    },
    {
      name: "Carne picada + polenta + espinaca",
      detail: "200g carne picada, 150g polenta, 100g espinaca",
      ingredientes: [
        { id: "carnePicada", cantidad: 200 },
        { id: "polenta", cantidad: 150 },
        { id: "espinaca", cantidad: 100 },
      ],
      carbLoad: true,
    },
    {
      name: "Rapiditas + carne picada + espinaca (burrito)",
      detail: "55g rapiditas, 150g carne picada, 100g espinaca",
      ingredientes: [
        { id: "rapiditas", cantidad: 55 },
        { id: "carnePicada", cantidad: 150 },
        { id: "espinaca", cantidad: 100 },
      ],
      carbLoad: false,
    },
    {
      name: "Chorizo + arroz",
      detail: "400g chorizo, 150g arroz",
      ingredientes: [
        { id: "chorizo", cantidad: 400 },
        { id: "arroz", cantidad: 150 },
      ],
      carbLoad: true,
    },
    {
      name: "Chorizo + polenta + espinaca",
      detail: "200g chorizo, 150g polenta, 100g espinaca",
      ingredientes: [
        { id: "chorizo", cantidad: 200 },
        { id: "polenta", cantidad: 150 },
        { id: "espinaca", cantidad: 100 },
      ],
      carbLoad: true,
    },
    {
      name: "Salsa de tomate + fideos integrales + espinaca",
      detail: "150g salsa de tomate, 250g fideos integrales, 100g espinaca",
      ingredientes: [
        { id: "salsaTomate", cantidad: 150 },
        { id: "fideosInteg", cantidad: 250 },
        { id: "espinaca", cantidad: 100 },
      ],
      carbLoad: true,
    },
  ],
  merienda: [
    {
      name: "Leche con proteínas + avena",
      detail: "250ml leche con proteínas + 30g avena",
      ingredientes: [
        { id: "lecheProte", cantidad: null },
        { id: "avena", cantidad: 30 },
      ],
      liviana: true,
    },
    {
      name: "Leche con proteínas + almendras",
      detail: "250ml leche con proteínas + 20g almendras",
      ingredientes: [
        { id: "lecheProte", cantidad: null },
        { id: "almendras", cantidad: 20 },
      ],
      liviana: true,
    },
    {
      name: "Pasta de maní con proteína + rapiditas",
      detail: "30g pasta de maní, 27.5g rapiditas (media porción)",
      ingredientes: [
        { id: "pastaMani", cantidad: 30 },
        { id: "rapiditas", cantidad: 27.5 },
      ],
      liviana: true,
    },
  ],
  cena: [
    {
      name: "2 huevos fritos + espinaca salteada",
      detail: "Rápido, poca preparación",
      ingredientes: [
        { id: "huevoFrito", cantidad: 100 },
        { id: "espinaca", cantidad: 100 },
      ],
      liviana: true,
    },
    {
      name: "Batido de proteína liviano",
      detail: "1 scoop (40g) + 250ml leche con proteínas",
      ingredientes: [
        { id: "batidoProte", cantidad: null },
        { id: "lecheProte", cantidad: null },
      ],
      liviana: true,
    },
    {
      name: "2 huevos fritos",
      detail: "Simple",
      ingredientes: [{ id: "huevoFrito", cantidad: 100 }],
      liviana: true,
    },
    {
      name: "Pasta de maní con proteína + rapiditas",
      detail: "30g pasta de maní, 27.5g rapiditas (media porción)",
      ingredientes: [
        { id: "pastaMani", cantidad: 30 },
        { id: "rapiditas", cantidad: 27.5 },
      ],
      liviana: false,
    },
  ],
};

const ingredienteProteina: Record<string, { prote100?: number; fixed?: number }> = {
  pollo: { prote100: 31 },
  carneVaca: { prote100: 27 },
  carnePicada: { prote100: 28 },
  milanesa: { prote100: 21 },
  huevoFrito: { prote100: 13 },
  arroz: { prote100: 7 },
  fideosInteg: { prote100: 11.25 },
  papa: { prote100: 2 },
  espinaca: { prote100: 3.6 },
  avena: { prote100: 3.3 },
  almendras: { prote100: 20 },
  pastaMani: { prote100: 37 },
  rapiditas: { prote100: 9.1 },
  polenta: { prote100: 7.2 },
  chorizo: { prote100: 17.5 },
  salsaTomate: { prote100: 1.7 },
  batidoProte: { fixed: 30 },
  lecheProte: { fixed: 12.5 },
};

function calcMealProtein(meal: Meal): number {
  return meal.ingredientes.reduce((total, item) => {
    const ing = ingredienteProteina[item.id];
    if (!ing) return total;
    if (ing.fixed !== undefined) return total + ing.fixed;
    return total + ((ing.prote100 ?? 0) * (item.cantidad ?? 0)) / 100;
  }, 0);
}

/** mulberry32: PRNG determinístico (misma semilla → misma secuencia siempre). */
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tope duro: ningún plato pasa MAX_SLOTS_SIN_SALIR turnos sin aparecer al menos una vez. */
const MAX_SLOTS_SIN_SALIR = 10;

function buildRecencySequence(length: number, totalSlots: number, seed: number): number[] {
  const rng = mulberry32(seed);
  const lastUsed = new Array(length).fill(0);
  const seq: number[] = [];
  let prevChosen = -1;
  for (let t = 0; t < totalSlots; t++) {
    const forced = lastUsed.findIndex((lu, i) => i !== prevChosen && t - lu >= MAX_SLOTS_SIN_SALIR);
    let chosen: number;
    if (forced !== -1) {
      chosen = forced;
    } else {
      const weights = lastUsed.map((lu, i) => (i === prevChosen ? 0 : Math.max(1, t - lu)));
      const wPow = weights.map((w) => Math.pow(w, 3));
      const totalWeight = wPow.reduce((a, b) => a + b, 0);
      let r = rng() * totalWeight;
      chosen = 0;
      for (let i = 0; i < length; i++) {
        r -= wPow[i];
        if (r <= 0) {
          chosen = i;
          break;
        }
      }
    }
    seq.push(chosen);
    lastUsed[chosen] = t;
    prevChosen = chosen;
  }
  return seq;
}

const ROTATION_SLOTS = getWeeks().length * 5 + 10;
const almuerzoSequence = buildRecencySequence(mealBank.almuerzo.length, ROTATION_SLOTS, 42);
const cenaSequence = buildRecencySequence(mealBank.cena.length, ROTATION_SLOTS, 99);

function pickAlmuerzo(weekNum: number, dayIdx: number): Meal {
  const bank = mealBank.almuerzo;
  if (getCarbLoadWeeks().includes(weekNum)) {
    const carbArr = bank.filter((m) => m.carbLoad);
    if (carbArr.length) return carbArr[dayIdx % carbArr.length];
  }
  const globalIdx = (weekNum - 1) * 5 + dayIdx;
  const seqIdx = almuerzoSequence[globalIdx % almuerzoSequence.length];
  return bank[seqIdx];
}

function hasIngredient(meal: Meal, id: string): boolean {
  return meal.ingredientes.some((i) => i.id === id);
}

function pickCena(weekNum: number, dayIdx: number, meriendaMeal: Meal): Meal {
  const bank = mealBank.cena;
  const globalIdx = (weekNum - 1) * 5 + dayIdx;
  const seqIdx = cenaSequence[globalIdx % cenaSequence.length];
  let cena = bank[seqIdx];

  // Regla dura: nunca el mismo plato que la merienda del día
  if (cena.name === meriendaMeal.name) {
    for (let off = 1; off < bank.length; off++) {
      const altIdx = cenaSequence[(globalIdx + off) % cenaSequence.length];
      if (bank[altIdx].name !== meriendaMeal.name) {
        cena = bank[altIdx];
        break;
      }
    }
  }

  // Regla blanda: evitar merienda liviana + cena liviana si hay alternativa
  if (meriendaMeal.liviana && cena.liviana) {
    for (let off = 1; off < bank.length; off++) {
      const altIdx = cenaSequence[(globalIdx + off) % cenaSequence.length];
      const alt = bank[altIdx];
      if (!alt.liviana && alt.name !== meriendaMeal.name) {
        cena = alt;
        break;
      }
    }
  }

  return cena;
}

function pickMeal(
  type: "desayuno" | "media" | "merienda",
  weekNum: number,
  dayIdx: number,
  offset: number,
): Meal {
  const arr = mealBank[type];
  let idx = (weekNum + dayIdx + offset) % arr.length;
  if (dayIdx > 0) {
    const prevIdx = (weekNum + (dayIdx - 1) + offset) % arr.length;
    if (idx === prevIdx) idx = (idx + 1) % arr.length;
  }
  return arr[idx];
}

function cloneMeal(meal: Meal): Meal {
  return { ...meal, ingredientes: meal.ingredientes.map((i) => ({ ...i })) };
}

function reinforceBreakfast(meal: Meal): Meal {
  const reinforced = cloneMeal(meal);
  reinforced.ingredientes.push({ id: "huevoFrito", cantidad: 100 });
  reinforced.detail = `${meal.detail} · + 2 huevos fritos extra (refuerzo proteína)`;
  return reinforced;
}

function reinforceWithBatido(meal: Meal): Meal {
  const reinforced = cloneMeal(meal);
  if (!hasIngredient(reinforced, "batidoProte"))
    reinforced.ingredientes.push({ id: "batidoProte", cantidad: null });
  if (!hasIngredient(reinforced, "lecheProte"))
    reinforced.ingredientes.push({ id: "lecheProte", cantidad: null });
  reinforced.detail = `${meal.detail} · + batido de proteína extra (refuerzo)`;
  return reinforced;
}

const LOW_LUNCH_PROTEIN_THRESHOLD = 55;

/** Si el almuerzo del día queda bajo en proteína: agranda desayuno, después batido en merienda, si no, refuerza la cena. */
function applyProteinReinforcement(meals: DayMeal[], almuerzoProtein: number): DayMeal[] {
  if (almuerzoProtein >= LOW_LUNCH_PROTEIN_THRESHOLD) return meals;

  const merienda = meals.find((m) => m.type === "merienda");

  return meals.map((m) => {
    if (m.type === "desayuno") {
      const meal = reinforceBreakfast(m.meal);
      return { ...m, meal, proteinG: calcMealProtein(meal) };
    }
    if (m.type === "merienda" && !hasIngredient(m.meal, "batidoProte")) {
      const meal = reinforceWithBatido(m.meal);
      return { ...m, meal, proteinG: calcMealProtein(meal) };
    }
    if (m.type === "cena") {
      const meriendaYaReforzada = merienda ? hasIngredient(merienda.meal, "batidoProte") : false;
      if (!meriendaYaReforzada || hasIngredient(m.meal, "batidoProte")) return m;
      const meal = reinforceWithBatido(m.meal);
      return { ...m, meal, proteinG: calcMealProtein(meal) };
    }
    return m;
  });
}

const MEAL_LABELS: Record<MealType, string> = {
  desayuno: "Desayuno",
  media: "Media mañana",
  almuerzo: "Almuerzo",
  merienda: "Merienda",
  cena: "Cena",
};

export interface DayPlan {
  meals: DayMeal[];
  totalProteinG: number;
  /** true = lunes a viernes con estructura fija; false = fin de semana libre. */
  isWeekday: boolean;
}

/**
 * Comidas del día para una semana (1-indexed, igual que lib/training-plan.ts)
 * y un índice de día 0=lunes..6=domingo. Sábado/domingo no tienen estructura fija.
 */
export function getMealsForDay(weekNum: number, dayIdx: number): DayPlan {
  if (dayIdx >= 5) {
    return { meals: [], totalProteinG: 0, isWeekday: false };
  }

  const offsets = { desayuno: 0, media: 1, merienda: 2 } as const;
  const meriendaMeal = pickMeal("merienda", weekNum, dayIdx, offsets.merienda);
  const almuerzoMeal = pickAlmuerzo(weekNum, dayIdx);
  const almuerzoProtein = calcMealProtein(almuerzoMeal);

  let meals: DayMeal[] = [
    {
      type: "desayuno",
      label: MEAL_LABELS.desayuno,
      meal: pickMeal("desayuno", weekNum, dayIdx, offsets.desayuno),
      proteinG: 0,
    },
    {
      type: "media",
      label: MEAL_LABELS.media,
      meal: pickMeal("media", weekNum, dayIdx, offsets.media),
      proteinG: 0,
    },
    {
      type: "almuerzo",
      label: MEAL_LABELS.almuerzo,
      meal: almuerzoMeal,
      proteinG: almuerzoProtein,
    },
    { type: "merienda", label: MEAL_LABELS.merienda, meal: meriendaMeal, proteinG: 0 },
    {
      type: "cena",
      label: MEAL_LABELS.cena,
      meal: pickCena(weekNum, dayIdx, meriendaMeal),
      proteinG: 0,
    },
  ];
  meals = meals.map((m) => (m.proteinG ? m : { ...m, proteinG: calcMealProtein(m.meal) }));
  meals = applyProteinReinforcement(meals, almuerzoProtein);

  const totalProteinG = meals.reduce((total, m) => total + m.proteinG, 0);
  return { meals, totalProteinG, isWeekday: true };
}

/** Reglas fijas del plan de comidas, tal como en plan_vida_2026.html. */
export const FIXED_RULES = [
  "Plato chico para desayuno/merienda (1 opción de cada grupo).",
  "Plato playo de 28cm para almuerzo/cena, medio plato de vegetales siempre.",
  "Vaso de agua antes de cada comida.",
  "Creatina diaria, aparte del cálculo de proteína.",
  "Sábado y domingo sin estructura fija (excepto en días de evento).",
] as const;
