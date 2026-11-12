import { z } from "zod";
import type { Meal } from "@/lib/meal-plan";

export const ZONAS = [
  "piernas",
  "glúteos",
  "espalda",
  "pecho",
  "hombros",
  "brazos",
  "core",
] as const;

/** Las mismas gymKey que referencia lib/training-plan.ts — la fase decide cuál toca cada día. */
export const GYM_KEYS = [
  "empuje",
  "tiron",
  "inferior",
  "inferiorRun",
  "empujeLight",
  "tironLight",
  "inferiorLight",
] as const;

// --- Input del usuario ---

export const chatSchema = z
  .array(
    z.object({
      role: z.enum(["user", "model"]),
      text: z.string().trim().min(1).max(1000),
    }),
  )
  .min(1)
  .max(12)
  .refine((msgs) => msgs.at(-1)?.role === "user", "El último mensaje tiene que ser del usuario");

export const planComidasInputSchema = z.object({
  texto: z.string().trim().min(3).max(1000),
  modo: z.enum(["agregar", "reemplazar"]),
});

export const rutinasInputSchema = z.object({
  equipo: z.string().trim().max(500),
  zonas: z.array(z.enum(ZONAS)).max(ZONAS.length),
});

export const planIaTipoSchema = z.enum(["comidas", "ejercicios"]);

// --- Salida de la IA (también input no confiable: se valida antes de guardar) ---

/** Texto que solo se muestra: si la IA se pasa de largo se recorta en vez de rechazar todo el plan. */
function shown(max: number, min = 1) {
  return z
    .string()
    .trim()
    .min(min)
    .transform((s) => (s.length > max ? `${s.slice(0, max - 1)}…` : s));
}

const aiMealSchema = z.object({
  name: shown(80),
  detail: shown(200, 0),
  proteinG: z.number().min(0).max(150),
  kcal: z.number().min(0).max(2000),
  ingredientes: z
    .array(
      z.object({
        nombre: shown(40),
        gramos: z.number().min(1).max(1000),
      }),
    )
    .min(1)
    .max(8),
  carbLoad: z.boolean(),
  liviana: z.boolean(),
});

function aiBankSchema(min: number, max: number) {
  const arr = z.array(aiMealSchema).min(min).max(max);
  return z.object({ desayuno: arr, media: arr, almuerzo: arr, merienda: arr, cena: arr });
}

/** "Agregar al plan": de 0 a 4 platos nuevos por tipo. */
export const aiMealsAgregarSchema = aiBankSchema(0, 4);
/**
 * "Armar plan nuevo": se piden 3-5 por tipo, pero se acepta lo que venga (hasta 8) y la action
 * completa con el banco base lo que falte — en el tier gratis la IA a veces devuelve menos.
 */
export const aiMealsReemplazarSchema = aiBankSchema(0, 8);

export type AiMeal = z.infer<typeof aiMealSchema>;

/** Plato de la IA → Meal de lib/meal-plan.ts (id "ia": sus totales vienen de proteinG/kcal). */
export function aiMealToMeal(m: AiMeal): Meal {
  return {
    name: m.name,
    detail: m.detail,
    proteinG: m.proteinG,
    kcal: m.kcal,
    carbLoad: m.carbLoad,
    liviana: m.liviana,
    ingredientes: m.ingredientes.map((i) => ({
      id: "ia",
      nombre: i.nombre,
      cantidad: Math.round(i.gramos),
    })),
  };
}

const routineSchema = z.object({
  label: shown(60),
  exercises: z
    .array(
      z.object({
        name: shown(60),
        sets: shown(40),
      }),
    )
    .min(2)
    .max(8),
});

export const routinesSchema = z.object(
  Object.fromEntries(GYM_KEYS.map((k) => [k, routineSchema])) as Record<
    (typeof GYM_KEYS)[number],
    typeof routineSchema
  >,
);

// --- Lo guardado en plan_ia (se re-valida al leer: el dueño puede escribir su fila vía RLS) ---

const storedMealSchema = z.object({
  name: z.string().max(80),
  detail: z.string().max(300),
  ingredientes: z
    .array(
      z.object({
        id: z.string().max(40),
        cantidad: z.number().min(0).max(2000).nullable(),
        nombre: z.string().max(40).optional(),
      }),
    )
    .max(10),
  carbLoad: z.boolean().optional(),
  liviana: z.boolean().optional(),
  proteinG: z.number().min(0).max(300).optional(),
  kcal: z.number().min(0).max(4000).optional(),
});

const storedArr = z.array(storedMealSchema).min(1).max(15);
export const mealBankSchema = z.object({
  desayuno: storedArr,
  media: storedArr,
  almuerzo: storedArr,
  merienda: storedArr,
  cena: storedArr,
});

/** JSON Schema para el `response_format` de Gemini, derivado del mismo schema zod. */
// Gemini rechaza schemas con límites numéricos/de largo anidados ("too many states for serving"):
// a la IA se le manda solo la forma; los límites van en el prompt y los aplica zod al validar.
const BOUND_KEYS = new Set([
  "$schema",
  "minimum",
  "maximum",
  "minLength",
  "maxLength",
  "minItems",
  "maxItems",
]);

export function toGeminiSchema(schema: z.ZodType): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(z.toJSONSchema(schema, { io: "input" }), (key, value) =>
      BOUND_KEYS.has(key) ? undefined : value,
    ),
  );
}
