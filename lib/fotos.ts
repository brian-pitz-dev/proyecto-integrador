import type { createClient } from "@/lib/supabase/server";
import { fromISO, toISO } from "@/lib/date";
import type { DatosFoto } from "@/lib/validation/registro";

/** Fotos de progreso (specs/007-fotos-progreso): una por día en `{user_id}/{fecha}.jpg`, sin tabla. */
export const BUCKET = "fotos-progreso";
/** El navegador ya la achicó a 1600 px en JPEG (200-600 KB): más que esto no vino de la app. */
export const MAX_BYTES = 1.5 * 1024 * 1024;
export const MAX_FOTOS = 100;
export const NOTA_MAX = 140;

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface Foto {
  fecha: string;
  url: string;
  nota: string | null;
  peso: number | null;
  grasa: number | null;
}

/** Categoría de `registro` de cada dato de la foto. */
const CATEGORIA = { nota: "foto", peso: "peso", grasa: "grasa" } as const;

/**
 * Los datos de una foto son filas de `registro` de su fecha: la nota (categoria "foto", valor 0),
 * el peso (un "peso" más: cuenta en el progreso de peso) y el % de grasa ("grasa"). Así entran
 * solos en "Descargar mis datos" y se borran con la cuenta. Cada dato que viene en `datos` queda
 * como una sola fila de ese día (las que había se borran); null lo borra; el que no viene no se toca.
 */
export async function fijarDelDia(
  supabase: Supabase,
  userId: string,
  fecha: string,
  datos: DatosFoto,
) {
  for (const clave of ["nota", "peso", "grasa"] as const) {
    const valor = datos[clave];
    if (valor === undefined) continue;
    const borrar = await supabase
      .from("registro")
      .delete()
      .eq("user_id", userId)
      .eq("categoria", CATEGORIA[clave])
      .eq("fecha", fecha);
    if (borrar.error) throw borrar.error;
    if (valor === null) continue;
    const { error } = await supabase.from("registro").insert([
      {
        categoria: CATEGORIA[clave],
        fecha,
        valor: typeof valor === "number" ? valor : 0,
        nota: typeof valor === "string" ? valor : null,
        user_id: userId,
      },
    ]);
    if (error) throw error;
  }
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
  const [firmadas, registros] = await Promise.all([
    supabase.storage.from(BUCKET).createSignedUrls(
      fechas.map((f) => fotoPath(userId, f)),
      segundos,
    ),
    supabase
      .from("registro")
      .select("categoria, fecha, valor, nota")
      .eq("user_id", userId)
      .in("categoria", Object.values(CATEGORIA))
      .in("fecha", fechas)
      // varios el mismo día (un peso corregido): gana el último cargado
      .order("created_at", { ascending: true }),
  ]);
  if (firmadas.error) throw firmadas.error;
  // sin los datos la foto igual se muestra: no vale tirar toda la lista por eso
  if (registros.error) console.error("datos de fotos", registros.error);
  const datos = new Map<string, Pick<Foto, "nota" | "peso" | "grasa">>();
  for (const r of registros.data ?? []) {
    const d = datos.get(r.fecha) ?? { nota: null, peso: null, grasa: null };
    if (r.categoria === "foto") d.nota = r.nota;
    else if (r.categoria === "peso") d.peso = Number(r.valor);
    else d.grasa = Number(r.valor);
    datos.set(r.fecha, d);
  }
  return fechas.flatMap((fecha, i) =>
    firmadas.data[i]?.signedUrl
      ? [
          {
            fecha,
            url: firmadas.data[i].signedUrl,
            ...(datos.get(fecha) ?? { nota: null, peso: null, grasa: null }),
          },
        ]
      : [],
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
