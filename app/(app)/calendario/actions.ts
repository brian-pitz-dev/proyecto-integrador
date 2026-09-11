"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { toggleDayDoneSchema } from "@/lib/validation/registro";
import type { ActionResult } from "@/lib/types";

function revalidateAffectedRoutes() {
  revalidatePath("/calendario");
  revalidatePath("/estadisticas");
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
