import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  turnstileToken: z.string().min(1),
});

const fechaSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

export const eventoSchema = z.object({
  tipo: z.enum(["carrera", "caminata"]),
  nombre: z.string().trim().min(1, "Falta el nombre").max(100),
  fecha: fechaSchema,
  distanciaKm: z.number().finite().positive().max(1000),
});

export const onboardingSchema = z.object({
  edad: z.number().int().min(10).max(100),
  alturaCm: z.number().finite().min(100).max(250),
  sexo: z.enum(["M", "F"]),
  pesoInicialKg: z.number().finite().min(30).max(300),
  factorActividad: z.number().finite().min(1).max(2.5).default(1.55),
  metaPesoKg: z.number().finite().min(30).max(300).nullish(),
  metaGrasaPct: z.string().trim().max(20).nullish(),
  calibracionPesoKg: z.number().finite().min(30).max(300).nullish(),
  calibracionBmrKcal: z.number().finite().min(500).max(6000).nullish(),
  eventos: z.array(eventoSchema).min(1, "Agregá al menos un evento"),
});
