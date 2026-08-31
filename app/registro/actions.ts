"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Categoria } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  message?: string;
}

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
  const supabase = createClient();
  const { error } = await supabase.from("registro").insert([
    {
      categoria: input.categoria,
      fecha: input.fecha,
      valor: input.valor,
      nota: input.nota ?? null,
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
  const supabase = createClient();
  const { error } = await supabase.from("registro").delete().eq("id", id);

  if (error) {
    return { ok: false, message: "No se pudo borrar el registro." };
  }

  revalidateAffectedRoutes();
  return { ok: true };
}
