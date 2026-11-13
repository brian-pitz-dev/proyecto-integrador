import type { createClient } from "@/lib/supabase/server";
import { fromISO, toISO } from "@/lib/date";

/** Fotos de progreso (specs/007-fotos-progreso): una por día en `{user_id}/{fecha}.jpg`, sin tabla. */
export const BUCKET = "fotos-progreso";
/** El navegador ya la achicó a 1600 px en JPEG (200-600 KB): más que esto no vino de la app. */
export const MAX_BYTES = 1.5 * 1024 * 1024;
export const MAX_FOTOS = 100;

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface Foto {
  fecha: string;
  url: string;
}

export const fotoPath = (userId: string, fecha: string) => `${userId}/${fecha}.jpg`;

/** "2026-11-13.jpg" → "2026-11-13"; null si el archivo no es una foto de la app. */
export function fechaDeArchivo(nombre: string): string | null {
  return /^(\d{4}-\d{2}-\d{2})\.jpg$/.exec(nombre)?.[1] ?? null;
}

/** Una fecha real (no "2026-02-30") y no futura. `hoy` en ISO. */
export function fechaFotoValida(fecha: string, hoy: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && toISO(fromISO(fecha)) === fecha && fecha <= hoy;
}

/** JPEG por sus primeros bytes (FF D8 FF), no por el nombre ni el tipo que dice el navegador. */
export function esJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

/** Nombres de los archivos de la carpeta del usuario. */
async function archivos(supabase: Supabase, userId: string): Promise<string[]> {
  // MAX_FOTOS + 1: alcanza para saber si ya llegó al tope sin traer de más
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(userId, { limit: MAX_FOTOS + 1, sortBy: { column: "name", order: "asc" } });
  if (error) throw error;
  return data.map((f) => f.name);
}

/** Fotos del usuario, de la más vieja a la más nueva, con URLs firmadas por `segundos`. */
export async function listarFotos(
  supabase: Supabase,
  userId: string,
  segundos: number,
): Promise<Foto[]> {
  const fechas = (await archivos(supabase, userId))
    .map(fechaDeArchivo)
    .filter((f): f is string => f !== null);
  if (!fechas.length) return [];
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(
    fechas.map((f) => fotoPath(userId, f)),
    segundos,
  );
  if (error) throw error;
  return fechas.flatMap((fecha, i) =>
    data[i]?.signedUrl ? [{ fecha, url: data[i].signedUrl }] : [],
  );
}

/** true si puede subir la foto de `fecha`: no llegó al tope, o reemplaza una que ya tiene. */
export async function hayLugar(supabase: Supabase, userId: string, fecha: string) {
  const nombres = await archivos(supabase, userId);
  return nombres.length < MAX_FOTOS || nombres.includes(`${fecha}.jpg`);
}

/**
 * Borra todas las fotos del usuario (antes de borrar la cuenta: Storage no cae en cascada y
 * Supabase no deja borrar storage.objects por SQL). Tira error si no pudo.
 */
export async function borrarTodasLasFotos(supabase: Supabase, userId: string) {
  // de a tandas: list() devuelve hasta MAX_FOTOS + 1 por vez
  for (;;) {
    const nombres = await archivos(supabase, userId);
    if (!nombres.length) return;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .remove(nombres.map((n) => `${userId}/${n}`));
    if (error) throw error;
    // si una política no deja borrar, Storage no da error: devuelve vacío (y el loop no cortaría)
    if (!data.length) throw new Error("No se pudieron borrar las fotos.");
  }
}
