"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/app/registro/actions";

function revalidateAffectedRoutes() {
  revalidatePath("/calendario");
  revalidatePath("/estadisticas");
}

/** Equivalente a toggleDayDone(fecha, isDone) de plan_vida_2026.html. */
export async function toggleDayDone(
  fecha: string,
  isDone: boolean,
): Promise<ActionResult> {
  const supabase = createClient();

  const { error } = isDone
    ? await supabase
        .from("registro")
        .insert([{ categoria: "completado", fecha, valor: 1 }])
    : await supabase
        .from("registro")
        .delete()
        .eq("categoria", "completado")
        .eq("fecha", fecha);

  if (error) {
    return { ok: false, message: "No se pudo actualizar el día." };
  }

  revalidateAffectedRoutes();
  return { ok: true };
}
