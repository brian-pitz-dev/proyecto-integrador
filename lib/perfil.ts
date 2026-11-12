/**
 * Guarda perfil + eventos y marca el onboarding como completo. Lo comparten el registro
 * en pasos (app/signup/actions.ts) y el /onboarding de respaldo (app/onboarding/actions.ts).
 * Módulo normal a propósito (no "use server"): así no queda expuesto como Server Action.
 */
import type { createClient } from "@/lib/supabase/server";
import { edadDesde, toISO, todayNormalized } from "@/lib/date";
import type { EventoInput, PerfilInput } from "@/lib/validation/onboarding";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** null si salió bien; si no, el mensaje de error para mostrar. */
export async function guardarPerfilYEventos(
  supabase: Supabase,
  userId: string,
  perfil: PerfilInput,
  eventos: EventoInput[],
): Promise<string | null> {
  const { error: perfilError } = await supabase.from("perfil").upsert({
    user_id: userId,
    fecha_nacimiento: perfil.fechaNacimiento,
    // edad se sigue guardando (columna not null de spec 004), pero se recalcula al leer desde fecha_nacimiento
    edad: edadDesde(perfil.fechaNacimiento),
    altura_cm: perfil.alturaCm,
    sexo: perfil.sexo,
    peso_inicial_kg: perfil.pesoInicialKg,
    factor_actividad: perfil.factorActividad,
    meta_peso_kg: perfil.metaPesoKg ?? null,
    meta_grasa_pct: perfil.metaGrasaPct ?? null,
    calibracion_peso_kg: perfil.calibracionPesoKg ?? null,
    calibracion_bmr_kcal: perfil.calibracionBmrKcal ?? null,
    plan_start: toISO(todayNormalized()),
  });
  if (perfilError) return "No se pudo guardar el perfil: " + perfilError.message;

  // Por si es un reintento tras un fallo parcial: evita duplicar eventos.
  const { error: deleteError } = await supabase.from("evento").delete().eq("user_id", userId);
  if (deleteError) return "No se pudieron guardar los eventos: " + deleteError.message;

  const { error: eventosError } = await supabase.from("evento").insert(
    eventos.map((e) => ({
      user_id: userId,
      tipo: e.tipo,
      nombre: e.nombre,
      fecha: e.fecha,
      distancia_km: e.distanciaKm,
    })),
  );
  if (eventosError) return "No se pudieron guardar los eventos: " + eventosError.message;

  const { error: metaError } = await supabase.auth.updateUser({
    data: { onboarding_completed: true },
  });
  if (metaError) return "No se pudo completar el registro: " + metaError.message;

  return null;
}
