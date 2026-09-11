"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { saveLogSchema } from "@/lib/validation/registro";
import { isSaveLogRateLimited, recordSaveLogAttempt } from "@/lib/rate-limit";
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

  if (isSaveLogRateLimited(user.id)) {
    return { ok: false, message: "Demasiados registros en poco tiempo, esperá un momento." };
  }
  recordSaveLogAttempt(user.id);

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
    return { ok: false, message: `No se pudo guardar: ${error.message}` };
  }

  revalidateAffectedRoutes();
  return { ok: true };
}

/** Equivalente a deleteLog(id) de plan_vida_2026.html. */
export async function deleteLog(id: number): Promise<ActionResult> {
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
