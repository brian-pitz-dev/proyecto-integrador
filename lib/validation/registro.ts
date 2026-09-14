import { z } from "zod";

const categoriaSchema = z.enum([
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
