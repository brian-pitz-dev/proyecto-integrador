"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { eventoSchema, perfilSchema } from "@/lib/validation/onboarding";
import { filaEvento, filaPerfil } from "@/lib/perfil";
import type { ActionResult } from "@/lib/types";

const actualizarSchema = z.object({
  nombre: z.string().trim().min(1, "Contanos tu nombre").max(60, "Nombre demasiado largo"),
  perfil: perfilSchema,
});
const guardarEventoSchema = z.object({ id: z.uuid().nullish(), evento: eventoSchema });

const primerError = (e: z.ZodError) => e.issues[0]?.message ?? "Datos inválidos.";

/** Perfil, eventos y disponibilidad alimentan todas las pestañas: se recalcula todo el grupo. */
function recalcular() {
  revalidatePath("/", "layout");
}

/** Edita datos + disponibilidad. No toca plan_start: el plan sigue contando desde el registro. */
export async function actualizarPerfil(input: unknown): Promise<ActionResult> {
  const user = await getAuthedUser();
  if (!user) return { ok: false, message: "No autenticado." };

  const parsed = actualizarSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: primerError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("perfil")
    .update(filaPerfil(parsed.data.perfil))
    .eq("user_id", user.id);
  if (error) return { ok: false, message: "No se pudo guardar el perfil." };

  if (parsed.data.nombre !== user.nombre) {
    const { error: metaError } = await supabase.auth.updateUser({
      data: { nombre: parsed.data.nombre },
    });
    if (metaError) return { ok: false, message: "No se pudo guardar el nombre." };
    // getAuthedUser lee el JWT: sin refrescar, el nombre viejo seguiría hasta que venza el token
    await supabase.auth.refreshSession();
  }

  recalcular();
  return { ok: true };
}

/** Alta (sin id) o edición (con id) de un evento propio. */
export async function guardarEvento(input: unknown): Promise<ActionResult> {
  const user = await getAuthedUser();
  if (!user) return { ok: false, message: "No autenticado." };

  const parsed = guardarEventoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: primerError(parsed.error) };
  const { id, evento } = parsed.data;

  const supabase = await createClient();
  const { data, error } = id
    ? await supabase
        .from("evento")
        .update(filaEvento(evento))
        .eq("id", id)
        .eq("user_id", user.id)
        .select("id")
    : await supabase
        .from("evento")
        .insert({ user_id: user.id, ...filaEvento(evento) })
        .select("id");
  if (error || !data?.length) return { ok: false, message: "No se pudo guardar el evento." };

  recalcular();
  return { ok: true };
}

export async function borrarEvento(id: unknown): Promise<ActionResult> {
  const user = await getAuthedUser();
  if (!user) return { ok: false, message: "No autenticado." };

  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false, message: "Evento inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("evento")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: "No se pudo borrar el evento." };

  recalcular();
  return { ok: true };
}
