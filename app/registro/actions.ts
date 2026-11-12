"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { saveLogSchema, toggleDayDoneSchema } from "@/lib/validation/registro";
import { saveLogLimiter } from "@/lib/rate-limit";
import type { Categoria, ActionResult } from "@/lib/types";

function revalidateAffectedRoutes() {
  revalidatePath("/calendario");
  revalidatePath("/estadisticas");
}

/** Equivalente a saveLog(categoria, fecha, valor, nota) de plan_vida_2026.html. */
export async function saveLog(input: {
  categoria: Categoria;
  fecha: string;
  valor: number;
  nota?: string | null;
}): Promise<ActionResult> {
  const user = await getAuthedUser();
  if (!user) {
    return { ok: false, message: "No autenticado." };
  }

  if (saveLogLimiter.isLimited(user.id)) {
    return { ok: false, message: "Demasiados registros en poco tiempo, esperá un momento." };
  }
  saveLogLimiter.record(user.id);

  const parsed = saveLogSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Datos inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("registro").insert([
    {
      categoria: parsed.data.categoria,
      fecha: parsed.data.fecha,
      valor: parsed.data.valor,
      nota: parsed.data.nota ?? null,
      user_id: user.id,
    },
  ]);

  if (error) {
    // el detalle va al log: el texto de Postgres expone nombres internos y no le sirve al usuario
    console.error("saveLog", error);
    return { ok: false, message: "No se pudo guardar, probá de nuevo." };
  }

  revalidateAffectedRoutes();
  return { ok: true };
}

/** Equivalente a deleteLog(id) de plan_vida_2026.html. */
export async function deleteLog(id: string): Promise<ActionResult> {
  const user = await getAuthedUser();
  if (!user) {
    return { ok: false, message: "No autenticado." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("registro").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    return { ok: false, message: "No se pudo borrar el registro." };
  }

  revalidateAffectedRoutes();
  return { ok: true };
}

/** Equivalente a toggleDayDone(fecha, isDone) de plan_vida_2026.html. */
export async function toggleDayDone(fecha: string, isDone: boolean): Promise<ActionResult> {
  const user = await getAuthedUser();
  if (!user) {
    return { ok: false, message: "No autenticado." };
  }

  const parsed = toggleDayDoneSchema.safeParse({ fecha, isDone });
  if (!parsed.success) {
    return { ok: false, message: "Datos inválidos." };
  }

  const supabase = await createClient();

  const { error } = isDone
    ? await supabase
        .from("registro")
        .insert([{ categoria: "completado", fecha, valor: 1, user_id: user.id }])
    : await supabase
        .from("registro")
        .delete()
        .eq("categoria", "completado")
        .eq("fecha", fecha)
        .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: "No se pudo actualizar el día." };
  }

  revalidateAffectedRoutes();
  return { ok: true };
}
