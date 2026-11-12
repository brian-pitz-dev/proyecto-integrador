"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { getUserPlanContext, type UserPlanContext } from "@/lib/user-plan";
import { coachLimiter } from "@/lib/rate-limit";
import { generate } from "@/lib/ai";
import { getCalorieTarget } from "@/lib/calorie-target";
import { mealBank, PROTEINA_G_POR_KG, type MealBank, type MealType } from "@/lib/meal-plan";
import { toISO, todayNormalized, addDays } from "@/lib/date";
import {
  AI_DAILY_LIMIT,
  COACH_SYSTEM,
  MEALS_SYSTEM,
  ROUTINES_SYSTEM,
  describeUser,
} from "@/lib/coach";
import {
  aiMealToMeal,
  aiMealsAgregarSchema,
  aiMealsReemplazarSchema,
  chatSchema,
  mealBankSchema,
  planComidasInputSchema,
  planIaTipoSchema,
  routinesSchema,
  rutinasInputSchema,
  toGeminiSchema,
} from "@/lib/validation/coach";
import type { ActionResult } from "@/lib/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;
type Ready = { ok: true; userId: string; supabase: Supabase; ctx: UserPlanContext };

const LIMIT_MESSAGE = `Usaste tus ${AI_DAILY_LIMIT} consultas de hoy. Mañana se renuevan.`;
const MEAL_TYPES: MealType[] = ["desayuno", "media", "almuerzo", "merienda", "cena"];
const MAX_PER_TYPE = 15;
const MIN_PER_TYPE = 3;

/** Sesión + rate limit por minuto. La cuota diaria la descuenta `cobrar`, justo antes de la IA. */
async function prepare(): Promise<Ready | { ok: false; message: string }> {
  const user = await getAuthedUser();
  if (!user) return { ok: false, message: "No autenticado." };

  if (coachLimiter.isLimited(user.id)) {
    return { ok: false, message: "Vas muy rápido, esperá un minuto." };
  }
  coachLimiter.record(user.id);

  const supabase = await createClient();
  const ctx = await getUserPlanContext();
  if (!ctx) return { ok: false, message: "Completá el onboarding primero." };

  return { ok: true, userId: user.id, supabase, ctx };
}

/** Consume 1 uso de forma atómica (consumir_uso_ia); false si otra request llegó primero al límite. */
async function consume(supabase: Supabase): Promise<boolean> {
  const { data, error } = await supabase.rpc("consumir_uso_ia");
  return !error && data === true;
}

/**
 * Descuenta 1 uso ANTES de llamar a la IA: así N pedidos en paralelo no pasan todos el chequeo
 * (el límite por minuto es por instancia) y no gastan la cuota gratis de Gemini que comparten
 * todos los usuarios. Si la IA falla, el uso ya se gastó: `cobrado` le avisa al cliente.
 * Ver specs/005-coach-ia/research.md, Decisión 2.
 */
async function cobrar<T extends { ok: boolean }>(
  supabase: Supabase,
  run: () => Promise<T>,
): Promise<(T & { cobrado: true }) | { ok: false; message: string }> {
  if (!(await consume(supabase))) return { ok: false, message: LIMIT_MESSAGE };
  return { ...(await run()), cobrado: true };
}

async function latestPeso(supabase: Supabase, userId: string): Promise<number | null> {
  const { data } = await supabase
    .from("registro")
    .select("valor")
    .eq("user_id", userId)
    .eq("categoria", "peso")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? Number(data.valor) : null;
}

/** Llama a la IA pidiendo JSON y lo valida con zod (la salida de la IA no es confiable). */
async function generateJson<T extends z.ZodType>(
  system: string,
  input: string,
  jsonSchema: z.ZodType,
  validator: T,
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; message: string }> {
  const result = await generate({ system, input, schema: toGeminiSchema(jsonSchema) });
  if (!result.ok) return result;
  let raw: unknown;
  try {
    raw = JSON.parse(result.text);
  } catch {
    return { ok: false, message: "La IA devolvió un formato inválido, probá de nuevo." };
  }
  const parsed = validator.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "La IA armó un plan incompleto, probá de nuevo." };
  }
  return { ok: true, data: parsed.data };
}

async function savePlan(
  supabase: Supabase,
  userId: string,
  tipo: "comidas" | "ejercicios",
  contenido: unknown,
): Promise<ActionResult> {
  const { error } = await supabase
    .from("plan_ia")
    .upsert(
      { user_id: userId, tipo, contenido, updated_at: new Date().toISOString() },
      { onConflict: "user_id,tipo" },
    );
  if (error) return { ok: false, message: "No se pudo guardar el plan." };
  revalidatePath("/coach");
  revalidatePath(tipo === "comidas" ? "/nutricion" : "/calendario");
  return { ok: true };
}

export async function chatCoach(
  messages: { role: "user" | "model"; text: string }[],
): Promise<ActionResult & { reply?: string; cobrado?: boolean }> {
  const ready = await prepare();
  if (!ready.ok) return ready;
  const parsed = chatSchema.safeParse(messages);
  if (!parsed.success) return { ok: false, message: "Mensaje inválido (máximo 1000 caracteres)." };

  const { supabase, userId, ctx } = ready;
  const desde = toISO(addDays(todayNormalized(), -14));
  const [peso, { data: logs }] = await Promise.all([
    latestPeso(supabase, userId),
    supabase
      .from("registro")
      .select("categoria, fecha, valor")
      .eq("user_id", userId)
      .in("categoria", ["peso", "sueno", "tirada", "caminata", "completado"])
      .gte("fecha", desde)
      .order("fecha", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const registros = (logs ?? []).map((r) => `- ${r.fecha} ${r.categoria}: ${r.valor}`).join("\n");
  const transcript = parsed.data
    .map((m) => `${m.role === "user" ? "Usuario" : "Coach"}: ${m.text}`)
    .join("\n\n");

  return cobrar(supabase, async () => {
    const result = await generate({
      system: `${COACH_SYSTEM}\n\nContexto del usuario:\n${describeUser(ctx, peso)}\n\nRegistros de los últimos 14 días:\n${registros || "- sin registros"}`,
      input: `${transcript}\n\nCoach:`,
    });
    return result.ok ? { ok: true, reply: result.text.trim() } : result;
  });
}

export async function generarPlanComidas(input: {
  texto: string;
  modo: "agregar" | "reemplazar";
}): Promise<ActionResult & { agregados?: number; cobrado?: boolean }> {
  const ready = await prepare();
  if (!ready.ok) return ready;
  const parsed = planComidasInputSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: "Contá qué tenés o querés comer (3 a 1000 caracteres)." };

  const { supabase, userId, ctx } = ready;
  const { texto, modo } = parsed.data;
  const peso = await latestPeso(supabase, userId);
  const target = await getCalorieTarget(todayNormalized(), ctx.profile, ctx.weeks);
  const current: MealBank = ctx.planIa.comidas ?? mealBank;
  const pesoKg = peso ?? ctx.profile.pesoInicialKg;

  const prompt = [
    describeUser(ctx, peso),
    target
      ? `Meta calórica de hoy: ~${target.meta} kcal (cambia según la fase).`
      : "Meta calórica: sin dato todavía.",
    `Proteína objetivo: ~${Math.round(pesoKg * PROTEINA_G_POR_KG)} g/día (${PROTEINA_G_POR_KG} g/kg); el almuerzo tiene que aportar al menos ~${Math.round(pesoKg * 0.58)} g.`,
    `Lo que el usuario tiene o quiere comer:\n"""${texto}"""`,
    modo === "agregar"
      ? `Convertí eso en platos NUEVOS para sumar a su banco (0 a 4 por tipo; dejá vacío el tipo que no aplique). No repitas estos platos que ya tiene:\n${MEAL_TYPES.map((t) => `- ${t}: ${current[t].map((m) => m.name).join("; ")}`).join("\n")}`
      : "Armá un banco COMPLETO nuevo de 3 a 5 platos por cada tipo (desayuno, media, almuerzo, merienda, cena) usando eso como base, con al menos un almuerzo carbLoad.",
  ].join("\n\n");

  const gen = await cobrar(supabase, () =>
    modo === "agregar"
      ? generateJson(MEALS_SYSTEM, prompt, aiMealsAgregarSchema, aiMealsAgregarSchema)
      : generateJson(MEALS_SYSTEM, prompt, aiMealsReemplazarSchema, aiMealsReemplazarSchema),
  );
  if (!gen.ok) return gen;
  // desde acá el uso ya se descontó: toda respuesta lleva cobrado
  const cobrado = true;

  let bank: MealBank;
  let agregados = 0;
  if (modo === "agregar") {
    bank = { ...current };
    for (const t of MEAL_TYPES) {
      const names = new Set(current[t].map((m) => m.name.toLowerCase()));
      const nuevos = gen.data[t].filter((m) => !names.has(m.name.toLowerCase())).map(aiMealToMeal);
      const room = MAX_PER_TYPE - current[t].length;
      const sumar = nuevos.slice(0, Math.max(0, room));
      agregados += sumar.length;
      bank[t] = [...current[t], ...sumar];
    }
    if (agregados === 0) {
      return {
        ok: false,
        message: "No salieron platos nuevos para agregar (¿ya estaban o el banco está lleno?).",
        cobrado,
      };
    }
  } else {
    bank = Object.fromEntries(
      MEAL_TYPES.map((t) => {
        const ia = gen.data[t].map(aiMealToMeal);
        // Si la IA devolvió menos de 3, se completa con platos del banco base (rotación usable).
        const relleno = mealBank[t].filter((m) => !ia.some((x) => x.name === m.name));
        return [t, ia.length >= MIN_PER_TYPE ? ia : [...ia, ...relleno].slice(0, MIN_PER_TYPE)];
      }),
    ) as MealBank;
    // La carga de carbos necesita al menos un almuerzo carbLoad.
    if (!bank.almuerzo.some((m) => m.carbLoad)) {
      const carb = mealBank.almuerzo.find((m) => m.carbLoad);
      if (carb) bank.almuerzo = [...bank.almuerzo, carb];
    }
    if (MEAL_TYPES.every((t) => gen.data[t].length === 0)) {
      return { ok: false, message: "La IA no armó ningún plato, probá de nuevo.", cobrado };
    }
  }

  // Doble chequeo contra el mismo schema con el que se lee (lib/user-plan.ts).
  if (!mealBankSchema.safeParse(bank).success) {
    return { ok: false, message: "La IA armó un plan inválido, probá de nuevo.", cobrado };
  }
  const saved = await savePlan(supabase, userId, "comidas", bank);
  return { ...saved, agregados, cobrado };
}

export async function generarRutinas(input: {
  equipo: string;
  zonas: string[];
}): Promise<ActionResult & { cobrado?: boolean }> {
  const ready = await prepare();
  if (!ready.ok) return ready;
  const parsed = rutinasInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Datos inválidos." };

  const { supabase, userId, ctx } = ready;
  const peso = await latestPeso(supabase, userId);
  const { equipo, zonas } = parsed.data;
  const prompt = [
    describeUser(ctx, peso),
    `Zonas a priorizar: ${zonas.length ? zonas.join(", ") : "ninguna en particular"}.`,
    `Equipo disponible:\n"""${equipo || "gimnasio comercial estándar"}"""`,
    "Armá las 7 rutinas.",
  ].join("\n\n");

  const gen = await cobrar(supabase, () =>
    generateJson(ROUTINES_SYSTEM, prompt, routinesSchema, routinesSchema),
  );
  if (!gen.ok) return gen;
  return { ...(await savePlan(supabase, userId, "ejercicios", gen.data)), cobrado: true };
}

/** Vuelve al plan base compartido (no consume cuota). */
export async function borrarPlanIa(tipo: "comidas" | "ejercicios"): Promise<ActionResult> {
  const user = await getAuthedUser();
  if (!user) return { ok: false, message: "No autenticado." };
  const parsed = planIaTipoSchema.safeParse(tipo);
  if (!parsed.success) return { ok: false, message: "Datos inválidos." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("plan_ia")
    .delete()
    .eq("user_id", user.id)
    .eq("tipo", parsed.data);
  if (error) return { ok: false, message: "No se pudo borrar el plan." };

  revalidatePath("/coach");
  revalidatePath(parsed.data === "comidas" ? "/nutricion" : "/calendario");
  return { ok: true };
}
