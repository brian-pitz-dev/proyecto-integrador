"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { toISO, todayNormalized } from "@/lib/date";
import {
  BUCKET,
  MAX_BYTES,
  MAX_FOTOS,
  esJpeg,
  fechaFotoValida,
  fotoPath,
  hayLugar,
} from "@/lib/fotos";
import type { ActionResult } from "@/lib/types";

/** Sube (o reemplaza) la foto de progreso de un día. El navegador ya la achicó a JPEG. */
export async function subirFoto(formData: FormData): Promise<ActionResult> {
  const user = await getAuthedUser();
  if (!user) return { ok: false, message: "No autenticado." };

  const fecha = formData.get("fecha");
  const foto = formData.get("foto");
  if (typeof fecha !== "string" || !fechaFotoValida(fecha, toISO(todayNormalized()))) {
    return { ok: false, message: "Elegí una fecha que no sea futura." };
  }
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
  return { ok: true, message: "Foto guardada." };
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

  revalidatePath("/estadisticas");
  return { ok: true, message: "Foto borrada." };
}
