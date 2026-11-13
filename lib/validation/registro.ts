import { z } from "zod";
import { NOTA_MAX } from "@/lib/fotos";

export const categoriaSchema = z.enum([
  "tirada",
  "caminata",
  "calorias",
  "peso",
  "sueno",
  "completado",
  "evento",
]);

const fechaSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

export const saveLogSchema = z.object({
  categoria: categoriaSchema,
  fecha: fechaSchema,
  valor: z.number().finite().min(0).max(100_000),
  nota: z.string().max(500).nullish(),
});

export const toggleDayDoneSchema = z.object({
  fecha: fechaSchema,
  isDone: z.boolean(),
});

/** "" = sin dato (null); si no, un número entre `min` y `max`. Llega como texto del formulario. */
const opcional = (min: number, max: number) =>
  z
    .union([z.literal(""), z.coerce.number().min(min).max(max)])
    .transform((v) => (v === "" ? null : v));

/**
 * Datos que acompañan una foto de progreso (spec 007). Parcial: el que no viene no se toca; el
 * que viene vacío (null) se borra.
 */
export const datosFotoSchema = z
  .object({
    nota: z
      .string()
      .trim()
      .max(NOTA_MAX)
      .transform((v) => v || null),
    peso: opcional(20, 400),
    grasa: opcional(2, 70),
  })
  .partial();

export type DatosFoto = z.output<typeof datosFotoSchema>;
