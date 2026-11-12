/**
 * Plan de comidas — portado 1:1 de plan_vida_2026.html.
 * No es dato de Supabase (Principio IV): vive como constante en el código,
 * igual que lib/training-plan.ts.
 */

export type MealType = "desayuno" | "media" | "almuerzo" | "merienda" | "cena";

export interface Ingrediente {
  /** Clave de ingredienteNutri; los platos generados por IA usan "ia" + `nombre`. */
  id: string;
  cantidad: number | null;
  nombre?: string;
}

export interface Meal {
  name: string;
  detail: string;
  ingredientes: Ingrediente[];
  carbLoad?: boolean;
  liviana?: boolean;
  /** Totales de la porción base estimados por la IA (los platos del banco base no los traen). */
  proteinG?: number;
  kcal?: number;
}

export interface DayMeal {
  type: MealType;
  label: string;
  meal: Meal;
  proteinG: number;
}

export type MealBank = Record<MealType, Meal[]>;

export const mealBank: MealBank = {
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

interface IngredienteNutri {
  nombre: string;
  prote100?: number;
  kcal100?: number;
  /** Porción fija (scoop / vaso): no se escala. */
  fixed?: number;
  fixedKcal?: number;
  /** Escalar de a unidades enteras (ej. 1 huevo = 50 g) en vez de a 5 g. */
  unidadG?: number;
}

// kcal100: valores de referencia aproximados, en la misma base (crudo/cocido) que
// el prote100 original de cada ingrediente — revisar contra las etiquetas reales.
const ingredienteNutri: Record<string, IngredienteNutri> = {
  pollo: { nombre: "pollo", prote100: 31, kcal100: 165 },
  carneVaca: { nombre: "carne", prote100: 27, kcal100: 250 },
  carnePicada: { nombre: "carne picada", prote100: 28, kcal100: 250 },
  milanesa: { nombre: "milanesa", prote100: 21, kcal100: 230 },
  huevoFrito: { nombre: "huevo frito", prote100: 13, kcal100: 196, unidadG: 50 },
  arroz: { nombre: "arroz", prote100: 7, kcal100: 360 },
  fideosInteg: { nombre: "fideos integrales", prote100: 11.25, kcal100: 350 },
  papa: { nombre: "papa", prote100: 2, kcal100: 77 },
  espinaca: { nombre: "espinaca", prote100: 3.6, kcal100: 23 },
  avena: { nombre: "avena", prote100: 3.3, kcal100: 70 },
  almendras: { nombre: "almendras", prote100: 20, kcal100: 580 },
  pastaMani: { nombre: "pasta de maní", prote100: 37, kcal100: 560 },
  rapiditas: { nombre: "rapiditas", prote100: 9.1, kcal100: 300 },
  polenta: { nombre: "polenta", prote100: 7.2, kcal100: 360 },
  chorizo: { nombre: "chorizo", prote100: 17.5, kcal100: 330 },
  salsaTomate: { nombre: "salsa de tomate", prote100: 1.7, kcal100: 30 },
  batidoProte: { nombre: "batido de proteína", fixed: 30, fixedKcal: 120 },
  lecheProte: { nombre: "leche con proteínas", fixed: 12.5, fixedKcal: 120 },
};

function sumNutri(meal: Meal, fixedKey: "fixed" | "fixedKcal", per100Key: "prote100" | "kcal100") {
  return meal.ingredientes.reduce((total, item) => {
    const ing = ingredienteNutri[item.id];
    if (!ing) return total;
    if (ing[fixedKey] !== undefined) return total + (ing[fixedKey] ?? 0);
    return total + ((ing[per100Key] ?? 0) * (item.cantidad ?? 0)) / 100;
  }, 0);
}

function calcMealProtein(meal: Meal): number {
  return (meal.proteinG ?? 0) + sumNutri(meal, "fixed", "prote100");
}

function calcMealKcal(meal: Meal): number {
  return (meal.kcal ?? 0) + sumNutri(meal, "fixedKcal", "kcal100");
}

/** "230 g pollo · 175 g arroz" — porción escalada, armada desde los ingredientes. */
export function formatPortion(meal: Meal): string {
  return meal.ingredientes
    .filter((i) => i.cantidad != null && ingredienteNutri[i.id]?.fixed === undefined)
    .map((i) => `${i.cantidad} g ${i.nombre ?? ingredienteNutri[i.id]?.nombre ?? i.id}`)
    .join(" · ");
}

const MIN_FACTOR = 0.75;
const MAX_FACTOR = 1.3;

/** Factor de porción para acercar las comidas del día a la meta calórica, acotado a [0.75, 1.3] y redondeado a 0.05. */
export function portionFactor(metaKcal: number, baseKcal: number): number {
  if (!(metaKcal > 0) || !(baseKcal > 0)) return 1;
  const f = Math.round((metaKcal / baseKcal) * 20) / 20;
  return Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, f));
}

function scaleMeal(meal: Meal, f: number): Meal {
  if (f === 1) return meal;
  return {
    ...meal,
    proteinG: meal.proteinG != null ? meal.proteinG * f : undefined,
    kcal: meal.kcal != null ? meal.kcal * f : undefined,
    ingredientes: meal.ingredientes.map((i) => {
      const ing = ingredienteNutri[i.id];
      if (i.cantidad == null || ing?.fixed !== undefined) return { ...i };
      const unidad = ing?.unidadG ?? 5;
      return { ...i, cantidad: Math.max(unidad, Math.round((i.cantidad * f) / unidad) * unidad) };
    }),
  };
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

// Generoso a propósito (~20 años de semanas): la secuencia mulberry32 es
// estrictamente secuencial, alargarla no cambia los valores que ya se usan,
// solo agrega más al final — ver lib/training-plan.ts buildPlan().
const ROTATION_SLOTS = 1040 * 5 + 10;
// Una secuencia por (largo del banco, semilla): el banco base de siempre cae en la misma
// entrada que antes; un banco propio (IA) de otro largo arma la suya.
const sequenceCache = new Map<string, number[]>();
function rotationSequence(length: number, seed: number): number[] {
  const key = `${length}:${seed}`;
  let seq = sequenceCache.get(key);
  if (!seq) {
    seq = buildRecencySequence(length, ROTATION_SLOTS, seed);
    sequenceCache.set(key, seq);
  }
  return seq;
}

function pickAlmuerzo(
  mealBank: MealBank,
  weekNum: number,
  dayIdx: number,
  carbLoadWeeks: number[],
): Meal {
  const bank = mealBank.almuerzo;
  const almuerzoSequence = rotationSequence(bank.length, 42);
  // la carga va solo jueves y viernes (dayIdx 3-4): para una carrera larga alcanzan 1-2 días
  if (dayIdx >= 3 && carbLoadWeeks.includes(weekNum)) {
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

function pickCena(mealBank: MealBank, weekNum: number, dayIdx: number, meriendaMeal: Meal): Meal {
  const bank = mealBank.cena;
  const cenaSequence = rotationSequence(bank.length, 99);
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
  mealBank: MealBank,
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
// 55 g / 94.9 kg (peso inicial de Brian, brian-migration.sql) ≈ 0.58 g/kg: a ese peso da el umbral de siempre.
const LUNCH_PROTEIN_G_PER_KG = 0.58;
/** Objetivo diario de proteína por kg de peso actual. */
export const PROTEINA_G_POR_KG = 1.8;

/** Proteína mínima del almuerzo antes de reforzar el resto del día; escala con el peso actual. */
export function umbralAlmuerzo(pesoKg?: number | null): number {
  return pesoKg && pesoKg > 0
    ? Math.round(pesoKg * LUNCH_PROTEIN_G_PER_KG)
    : LOW_LUNCH_PROTEIN_THRESHOLD;
}

/** Si el almuerzo del día queda bajo en proteína: agranda desayuno, después batido en merienda, si no, refuerza la cena. */
function applyProteinReinforcement(
  meals: DayMeal[],
  almuerzoProtein: number,
  threshold: number,
): DayMeal[] {
  if (almuerzoProtein >= threshold) return meals;
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
  totalKcal: number;
  /** Factor de porción aplicado para acercarse a la meta calórica (1 = porción base). */
  factor: number;
  /** true = lunes a viernes con estructura fija; false = fin de semana libre. */
  isWeekday: boolean;
}

export interface MealsForDayOptions {
  /** Banco propio del usuario (plan_ia); si falta, el banco base compartido. */
  bank?: MealBank;
  /** Meta calórica del día: si llega, las porciones se escalan hacia ella. */
  metaKcal?: number | null;
  /** Peso actual: ajusta el umbral de proteína del almuerzo. */
  pesoKg?: number | null;
}

/**
 * Comidas del día para una semana (1-indexed, igual que lib/training-plan.ts)
 * y un índice de día 0=lunes..6=domingo. Sábado/domingo no tienen estructura fija.
 * Sin `opts` da exactamente el mismo resultado que el plan original.
 */
export function getMealsForDay(
  weekNum: number,
  dayIdx: number,
  carbLoadWeeks: number[],
  opts: MealsForDayOptions = {},
): DayPlan {
  if (dayIdx >= 5) {
    return { meals: [], totalProteinG: 0, totalKcal: 0, factor: 1, isWeekday: false };
  }

  const bank = opts.bank ?? mealBank;
  const offsets = { desayuno: 0, media: 1, merienda: 2 } as const;
  const meriendaMeal = pickMeal(bank, "merienda", weekNum, dayIdx, offsets.merienda);
  const picked: Record<MealType, Meal> = {
    desayuno: pickMeal(bank, "desayuno", weekNum, dayIdx, offsets.desayuno),
    media: pickMeal(bank, "media", weekNum, dayIdx, offsets.media),
    almuerzo: pickAlmuerzo(bank, weekNum, dayIdx, carbLoadWeeks),
    merienda: meriendaMeal,
    cena: pickCena(bank, weekNum, dayIdx, meriendaMeal),
  };

  const types = Object.keys(MEAL_LABELS) as MealType[];
  const threshold = umbralAlmuerzo(opts.pesoKg);
  const kcalOf = (meals: DayMeal[]) => meals.reduce((total, m) => total + calcMealKcal(m.meal), 0);

  function buildDay(factor: number): DayMeal[] {
    const meals: DayMeal[] = types.map((type) => {
      const meal = scaleMeal(picked[type], factor);
      return { type, label: MEAL_LABELS[type], meal, proteinG: calcMealProtein(meal) };
    });
    return applyProteinReinforcement(meals, meals[types.indexOf("almuerzo")].proteinG, threshold);
  }

  let factor = 1;
  if (opts.metaKcal) {
    const baseKcal = types.reduce((total, t) => total + calcMealKcal(picked[t]), 0);
    // 2 pasadas: el refuerzo de proteína (no escalable) suma kcal, así que se descuenta de la meta.
    const first = portionFactor(opts.metaKcal, baseKcal);
    const reinforceKcal =
      kcalOf(buildDay(first)) -
      types.reduce((total, t) => total + calcMealKcal(scaleMeal(picked[t], first)), 0);
    factor = portionFactor(opts.metaKcal - reinforceKcal, baseKcal);
  }

  const meals = buildDay(factor);
  const totalProteinG = meals.reduce((total, m) => total + m.proteinG, 0);
  return { meals, totalProteinG, totalKcal: kcalOf(meals), factor, isWeekday: true };
}

/** Reglas fijas del plan de comidas, tal como en plan_vida_2026.html. */
export const FIXED_RULES = [
  "Plato chico para desayuno/merienda (1 opción de cada grupo).",
  "Plato playo de 28cm para almuerzo/cena, medio plato de vegetales siempre.",
  "Vaso de agua antes de cada comida.",
  "Creatina diaria, aparte del cálculo de proteína.",
  "Sábado y domingo sin estructura fija (excepto en días de evento).",
] as const;
