"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { claveActualSchema, verificarClave } from "@/lib/verificar-clave";
import { borrarTodasLasFotos } from "@/lib/fotos";
import { desconectar as desconectarStrava } from "@/lib/strava";
import {
  eventoSchema,
  historialDisponibilidadSchema,
  nuevaClaveSchema,
  perfilSchema,
} from "@/lib/validation/onboarding";
import { filaEvento, filaPerfil, mensajeClaveRechazada } from "@/lib/perfil";
import { registrarCambioDisponibilidad } from "@/lib/training-plan";
import { todayNormalized } from "@/lib/date";
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
  const { data: actual } = await supabase
    .from("perfil")
    .select("dias_entrenamiento, minutos_sesion, disponibilidad_historial")
    .eq("user_id", user.id)
    .maybeSingle();
  const fila = filaPerfil(parsed.data.perfil);
  const historial = actual
    ? registrarCambioDisponibilidad(
        historialDisponibilidadSchema.safeParse(actual.disponibilidad_historial).data ?? [],
        { dias: actual.dias_entrenamiento, minutos: actual.minutos_sesion },
        { dias: fila.dias_entrenamiento, minutos: fila.minutos_sesion },
        todayNormalized(),
      )
    : [];

  const { error } = await supabase
    .from("perfil")
    .update({ ...fila, disponibilidad_historial: historial })
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

/**
 * Primer paso de los cambios delicados de /perfil: la UI habilita el resto del formulario recién
 * cuando la contraseña es correcta. Solo es UX: cada acción la vuelve a verificar.
 */
export async function confirmarClave(password: unknown): Promise<ActionResult> {
  const user = await getAuthedUser();
  if (!user?.email) return { ok: false, message: "No autenticado." };

  const parsed = claveActualSchema.safeParse(password);
  if (!parsed.success) return { ok: false, message: "Escribí tu contraseña." };

  const rechazo = await verificarClave(await createClient(), user.email, parsed.data);
  return rechazo ? { ok: false, message: rechazo } : { ok: true };
}

/** Cambio de contraseña desde /perfil: pide la actual y cierra las otras sesiones. */
export async function actualizarClave(input: unknown): Promise<ActionResult> {
  const user = await getAuthedUser();
  if (!user?.email) return { ok: false, message: "No autenticado." };

  const parsed = z.object({ actual: claveActualSchema }).and(nuevaClaveSchema).safeParse(input);
  if (!parsed.success) return { ok: false, message: primerError(parsed.error) };

  const supabase = await createClient();
  const rechazo = await verificarClave(supabase, user.email, parsed.data.actual);
  if (rechazo) return { ok: false, message: rechazo };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    console.error("updateUser password", error);
    return { ok: false, message: mensajeClaveRechazada(error.code) };
  }
  await supabase.auth.signOut({ scope: "others" });
  return { ok: true, message: "Listo, tu contraseña cambió." };
}

/**
 * Cambio de email: Supabase manda el link de confirmación (al email nuevo y, con "secure email
 * change", también al actual) y el cambio se aplica al confirmar, en /auth/confirm.
 */
export async function actualizarEmail(input: unknown): Promise<ActionResult> {
  const user = await getAuthedUser();
  if (!user?.email) return { ok: false, message: "No autenticado." };

  const parsed = z
    .object({
      email: z.string().trim().toLowerCase().email("Email inválido"),
      password: claveActualSchema,
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, message: primerError(parsed.error) };
  const { email, password } = parsed.data;
  if (email === user.email.toLowerCase()) return { ok: false, message: "Ese ya es tu email." };

  const supabase = await createClient();
  const rechazo = await verificarClave(supabase, user.email, password);
  if (rechazo) return { ok: false, message: rechazo };

  const origin = (await headers()).get("origin");
  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: origin ? `${origin}/auth/confirm?type=email_change` : undefined },
  );
  if (error) {
    if (error.code === "email_exists") {
      return { ok: false, message: "Ya hay una cuenta con ese email." };
    }
    if (error.code === "over_email_send_rate_limit") {
      return { ok: false, message: "Mandamos demasiados mails. Probá de nuevo en un rato." };
    }
    console.error("updateUser email", error);
    return { ok: false, message: "No se pudo cambiar el email." };
  }
  return {
    ok: true,
    message: `Te mandamos un link a ${email}. Si también te llega uno a tu email actual, confirmá los dos.`,
  };
}

/**
 * Baja de la cuenta con todos sus datos (supabase/migrations/..._borrar_cuenta.sql). Pide la
 * contraseña: una sesión abierta en otra compu no alcanza para borrar todo.
 */
export async function borrarCuenta(password: unknown): Promise<ActionResult> {
  const user = await getAuthedUser();
  if (!user?.email) return { ok: false, message: "No autenticado." };

  const parsed = claveActualSchema.safeParse(password);
  if (!parsed.success) return { ok: false, message: "Escribí tu contraseña." };

  const supabase = await createClient();
  const rechazo = await verificarClave(supabase, user.email, parsed.data);
  if (rechazo) return { ok: false, message: rechazo };

  // primero las fotos: Storage no cae en cascada con la cuenta, y si fallan la cuenta queda intacta
  try {
    await borrarTodasLasFotos(supabase, user.id);
  } catch (error) {
    console.error("borrar fotos", error);
    return { ok: false, message: "No se pudieron borrar tus fotos. Probá de nuevo." };
  }

  // la fila se borra en cascada con la cuenta, pero el permiso en Strava hay que revocarlo
  await desconectarStrava(supabase, user.id).catch((e) => console.error("strava desconectar", e));

  const { error } = await supabase.rpc("borrar_mi_cuenta");
  if (error) {
    console.error("borrar_mi_cuenta", error);
    return { ok: false, message: "No se pudo borrar la cuenta. Probá de nuevo." };
  }

  // El usuario ya no existe: solo se limpian las cookies de la sesión.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?borrada=1");
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
