"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { toISO, todayNormalized } from "@/lib/date";
import {
  BUCKET,
  MAX_BYTES,
  MAX_FOTOS,
  NOTA_MAX,
  esJpeg,
  fechaFotoValida,
  fijarDelDia,
  fotoPath,
  hayLugar,
} from "@/lib/fotos";
import { datosFotoSchema, type DatosFoto } from "@/lib/validation/registro";
import { desconectar, importar } from "@/lib/strava";
import { stravaLimiter } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/types";

/** Valida nota, peso y grasa; con error, el mensaje del primer campo que falla. */
function datosValidos(input: unknown): { datos: DatosFoto } | { message: string } {
  const parsed = datosFotoSchema.safeParse(input);
  if (parsed.success) return { datos: parsed.data };
  const campo = parsed.error.issues[0]?.path[0];
  return {
    message:
      campo === "peso"
        ? "El peso va entre 20 y 400 kg."
        : campo === "grasa"
          ? "El % de grasa va entre 2 y 70."
          : `La nota va hasta ${NOTA_MAX} caracteres.`,
  };
}

/** Sube (o reemplaza) la foto de progreso de un día. El navegador ya la achicó a JPEG. */
export async function subirFoto(formData: FormData): Promise<ActionResult> {
  const user = await getAuthedUser();
  if (!user) return { ok: false, message: "No autenticado." };

  const fecha = formData.get("fecha");
  const foto = formData.get("foto");
  const valid = datosValidos({
    nota: formData.get("nota") ?? "",
    peso: formData.get("peso") ?? "",
    grasa: formData.get("grasa") ?? "",
  });
  if (typeof fecha !== "string" || !fechaFotoValida(fecha, toISO(todayNormalized()))) {
    return { ok: false, message: "Elegí una fecha que no sea futura." };
  }
  if ("message" in valid) return { ok: false, message: valid.message };
  if (!(foto instanceof File) || foto.size === 0) return { ok: false, message: "Elegí una foto." };
  if (foto.size > MAX_BYTES) return { ok: false, message: "La foto pesa demasiado." };
  const bytes = new Uint8Array(await foto.arrayBuffer());
  if (!esJpeg(bytes)) return { ok: false, message: "No pudimos leer esa imagen." };

  const supabase = await createClient();
  try {
    if (!(await hayLugar(supabase, user.id, fecha))) {
      return {
        ok: false,
        message: `Llegaste a ${MAX_FOTOS} fotos. Borrá alguna para subir otra.`,
      };
    }
  } catch (error) {
    console.error("listar fotos", error);
    return { ok: false, message: "No se pudo subir la foto." };
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fotoPath(user.id, fecha), bytes, { contentType: "image/jpeg", upsert: true });
  if (error) {
    console.error("subir foto", error);
    return { ok: false, message: "No se pudo subir la foto." };
  }

  revalidatePath("/estadisticas");
  // los vacíos no pisan lo que ya había (reemplazar la foto de un día no borra sus datos)
  const datos = Object.fromEntries(Object.entries(valid.datos).filter(([, v]) => v !== null));
  try {
    await fijarDelDia(supabase, user.id, fecha, datos);
  } catch (error) {
    console.error("datos de foto", error);
    return { ok: false, message: "La foto se guardó, pero sus datos no. Probá editarlos." };
  }
  return { ok: true, message: "Foto guardada." };
}

/** Cambia la nota, el peso o el % de grasa de una foto: solo los que vienen; vacío los borra. */
export async function guardarDatosFoto(fecha: unknown, cambios: unknown): Promise<ActionResult> {
  const user = await getAuthedUser();
  if (!user) return { ok: false, message: "No autenticado." };
  if (typeof fecha !== "string" || !fechaFotoValida(fecha, toISO(todayNormalized()))) {
    return { ok: false, message: "Foto inválida." };
  }
  const valid = datosValidos(cambios);
  if ("message" in valid) return { ok: false, message: valid.message };

  try {
    await fijarDelDia(await createClient(), user.id, fecha, valid.datos);
  } catch (error) {
    console.error("datos de foto", error);
    return { ok: false, message: "No se pudieron guardar los datos." };
  }
  revalidatePath("/estadisticas");
  return { ok: true, message: "Datos guardados." };
}

export async function borrarFoto(fecha: unknown): Promise<ActionResult> {
  const user = await getAuthedUser();
  if (!user) return { ok: false, message: "No autenticado." };
  if (typeof fecha !== "string" || !fechaFotoValida(fecha, toISO(todayNormalized()))) {
    return { ok: false, message: "Foto inválida." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).remove([fotoPath(user.id, fecha)]);
  if (error || !data.length) return { ok: false, message: "No se pudo borrar la foto." };
  // el peso queda: es un registro de peso más. Si esto falla, nota y grasa quedan sin foto.
  await fijarDelDia(supabase, user.id, fecha, { nota: null, grasa: null }).catch((e) =>
    console.error("datos de foto", e),
  );

  revalidatePath("/estadisticas");
  return { ok: true, message: "Foto borrada." };
}

/** Importa las actividades nuevas de Strava a `registro` (specs/010-strava). */
export async function importarStrava(): Promise<ActionResult> {
  const user = await getAuthedUser();
  if (!user) return { ok: false, message: "No autenticado." };
  if (stravaLimiter.isLimited(user.id)) {
    return { ok: false, message: "Esperá un minuto antes de volver a importar." };
  }
  stravaLimiter.record(user.id);

  let cargadas: number | null;
  try {
    cargadas = await importar(await createClient(), user.id);
  } catch (error) {
    console.error("strava importar", error);
    return { ok: false, message: "No se pudo importar de Strava. Probá de nuevo más tarde." };
  }
  if (cargadas === null) return { ok: false, message: "Tu cuenta de Strava no está conectada." };
  revalidatePath("/estadisticas");
  return {
    ok: true,
    message: cargadas
      ? `Listo: ${cargadas} ${cargadas === 1 ? "actividad nueva" : "actividades nuevas"}.`
      : "No hay corridas ni caminatas nuevas.",
  };
}

export async function desconectarStrava(): Promise<ActionResult> {
  const user = await getAuthedUser();
  if (!user) return { ok: false, message: "No autenticado." };
  try {
    await desconectar(await createClient(), user.id);
  } catch (error) {
    console.error("strava desconectar", error);
    return { ok: false, message: "No se pudo desconectar Strava." };
  }
  revalidatePath("/estadisticas");
  return { ok: true, message: "Strava desconectado. Lo que ya importaste queda." };
}
