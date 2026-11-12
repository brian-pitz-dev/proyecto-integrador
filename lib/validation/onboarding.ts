import { z } from "zod";
import { edadDesde, toISO, todayNormalized } from "@/lib/date";

// Los mismos schemas validan cada paso del registro en el cliente y el envío completo en el server.

function fecha(vacia: string) {
  return z
    .string()
    .min(1, vacia)
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");
}

/** Número obligatorio con mensajes en castellano (el cliente manda undefined si el campo está vacío). */
function numero(label: string, min: number, max: number) {
  return z
    .number({ error: `Completá ${label}` })
    .finite()
    .min(min, `${label[0].toUpperCase()}${label.slice(1)}: entre ${min} y ${max}`)
    .max(max, `${label[0].toUpperCase()}${label.slice(1)}: entre ${min} y ${max}`);
}

export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "La contraseña es demasiado larga")
  .regex(/[A-Za-z]/, "La contraseña tiene que tener al menos una letra")
  .regex(/\d/, "La contraseña tiene que tener al menos un número");

/** Paso 1: cuenta. */
export const cuentaSchema = z
  .object({
    nombre: z.string().trim().min(1, "Contanos tu nombre").max(60, "Nombre demasiado largo"),
    email: z.string().trim().email("Email inválido"),
    password: passwordSchema,
    passwordConfirm: z.string(),
    aceptaTerminos: z.literal(true, { error: "Tenés que aceptar los términos y la privacidad" }),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Las contraseñas no coinciden",
    path: ["passwordConfirm"],
  });

/** Paso 2: perfil (lo que necesita el cálculo de calorías y el plan). */
export const perfilSchema = z.object({
  fechaNacimiento: fecha("Completá tu fecha de nacimiento").refine((f) => {
    const edad = edadDesde(f);
    return edad >= 13 && edad <= 100;
  }, "Tenés que tener entre 13 y 100 años"),
  alturaCm: numero("la altura", 100, 250),
  sexo: z.enum(["M", "F"], { error: "Elegí una opción" }),
  pesoInicialKg: numero("el peso", 30, 300),
  factorActividad: z.number().finite().min(1).max(2.5).default(1.55),
  metaPesoKg: z.number().finite().min(30).max(300).nullish(),
  metaGrasaPct: z.string().trim().max(20).nullish(),
  calibracionPesoKg: z.number().finite().min(30).max(300).nullish(),
  calibracionBmrKcal: z.number().finite().min(500).max(6000).nullish(),
});

export const eventoSchema = z.object({
  tipo: z.enum(["carrera", "caminata"]),
  nombre: z.string().trim().min(1, "Falta el nombre").max(100),
  // comparación de strings ISO: válida porque YYYY-MM-DD ordena igual lexicográfica y cronológicamente
  fecha: fecha("Completá la fecha").refine(
    (fecha) => fecha > toISO(todayNormalized()),
    "La fecha del evento tiene que ser futura",
  ),
  distanciaKm: numero("la distancia", 0.1, 1000),
});

/** Paso 3: eventos. */
export const eventosSchema = z.array(eventoSchema).min(1, "Agregá al menos un evento");

/** /onboarding: cuenta ya creada, solo perfil + eventos. */
export const onboardingSchema = perfilSchema.extend({ eventos: eventosSchema });

/** /signup: el registro completo en un solo envío. */
export const registroSchema = z.object({
  cuenta: cuentaSchema,
  perfil: perfilSchema,
  eventos: eventosSchema,
  turnstileToken: z.string().min(1, "Completá la verificación anti-bot"),
});

export type PerfilInput = z.infer<typeof perfilSchema>;
export type EventoInput = z.infer<typeof eventoSchema>;
