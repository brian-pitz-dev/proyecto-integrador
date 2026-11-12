"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Plus, Trash2 } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTurnstile } from "@/components/turnstile";
import { addDays, toISO, todayNormalized } from "@/lib/date";
import { cuentaSchema, eventosSchema, perfilSchema } from "@/lib/validation/onboarding";
import { registrar } from "@/app/signup/actions";
import { completeOnboarding } from "@/app/onboarding/actions";

const SEXO = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
];
const TIPO_EVENTO = [
  { value: "carrera", label: "Carrera" },
  { value: "caminata", label: "Caminata" },
];

const ACTIVIDAD = [
  { value: "1.2", label: "Sedentario: poco o nada de ejercicio" },
  { value: "1.375", label: "Liviano: 1-3 días por semana" },
  { value: "1.55", label: "Moderado: 3-5 días por semana" },
  { value: "1.725", label: "Activo: 6-7 días por semana" },
  { value: "1.9", label: "Muy activo: doble turno o trabajo físico" },
];

interface Cuenta {
  nombre: string;
  email: string;
  password: string;
  passwordConfirm: string;
  aceptaTerminos: boolean;
}

interface Perfil {
  fechaNacimiento: string;
  sexo: string;
  alturaCm: string;
  pesoInicialKg: string;
  factorActividad: string;
  metaPesoKg: string;
  metaGrasaPct: string;
  calibracionPesoKg: string;
  calibracionBmrKcal: string;
}

interface EventoDraft {
  tipo: "carrera" | "caminata";
  nombre: string;
  fecha: string;
  distanciaKm: string;
}

type Errors = Record<string, string>;

const emptyEvento = (): EventoDraft => ({
  tipo: "carrera",
  nombre: "",
  fecha: "",
  distanciaKm: "",
});
const num = (s: string) => (s.trim() === "" ? undefined : Number(s));

function toPerfil(p: Perfil) {
  return {
    fechaNacimiento: p.fechaNacimiento,
    sexo: p.sexo as "M" | "F",
    alturaCm: num(p.alturaCm),
    pesoInicialKg: num(p.pesoInicialKg),
    factorActividad: Number(p.factorActividad),
    metaPesoKg: num(p.metaPesoKg) ?? null,
    metaGrasaPct: p.metaGrasaPct.trim() || null,
    calibracionPesoKg: num(p.calibracionPesoKg) ?? null,
    calibracionBmrKcal: num(p.calibracionBmrKcal) ?? null,
  };
}

function toEventos(eventos: EventoDraft[]) {
  return eventos.map((e) => ({
    tipo: e.tipo,
    nombre: e.nombre.trim(),
    fecha: e.fecha,
    distanciaKm: num(e.distanciaKm),
  }));
}

/** Errores de zod → { "campo": "mensaje" } (primer error de cada campo). */
function errorsOf(result: z.ZodSafeParseResult<unknown>, prefix = ""): Errors {
  if (result.success) return {};
  const out: Errors = {};
  for (const issue of result.error.issues) {
    const key = prefix + issue.path.join(".");
    out[key] ??= issue.message;
  }
  return out;
}

function Field({
  id,
  label,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/** Desplegable que se abre debajo de su caja (el <select> nativo de macOS se abre encima). */
function Opciones({
  id,
  value,
  onChange,
  items,
  placeholder,
  ...rest
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  items: { value: string; label: string }[];
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  return (
    <Select items={items} value={value || null} onValueChange={(v) => onChange(String(v ?? ""))}>
      <SelectTrigger id={id} className="w-full" {...rest}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Requisitos de la contraseña en una línea, bajo su campo; en rojo los que faltan si se intentó avanzar. */
function Requisitos({
  id,
  items,
  marcar,
}: {
  id: string;
  items: { ok: boolean; label: string }[];
  marcar: boolean;
}) {
  return (
    <ul id={id} className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
      {items.map((r) => (
        <li
          key={r.label}
          className={cn(
            "flex items-center gap-1",
            r.ok ? "text-foreground" : marcar ? "text-destructive" : "text-muted-foreground",
          )}
        >
          <Check
            className={cn("size-3", r.ok ? "text-primary" : "opacity-30")}
            aria-hidden="true"
          />
          {r.label}
          <span className="sr-only">{r.ok ? "(cumplido)" : "(pendiente)"}</span>
        </li>
      ))}
    </ul>
  );
}

/** Para pasar a cada input: marca inválido y lo vincula a su mensaje. */
const invalid = (errors: Errors, key: string, id: string) =>
  errors[key] ? { "aria-invalid": true, "aria-describedby": `${id}-error` } : {};

export function RegistroWizard({ mode }: { mode: "signup" | "onboarding" }) {
  const pasos = mode === "signup" ? ["Cuenta", "Perfil", "Eventos"] : ["Perfil", "Eventos"];
  const offset = mode === "signup" ? 0 : 1; // índice lógico: 0 cuenta, 1 perfil, 2 eventos
  const [paso, setPaso] = useState(0);
  const logico = paso + offset;
  const ultimo = paso === pasos.length - 1;

  const [cuenta, setCuenta] = useState<Cuenta>({
    nombre: "",
    email: "",
    password: "",
    passwordConfirm: "",
    aceptaTerminos: false,
  });
  const [perfil, setPerfil] = useState<Perfil>({
    fechaNacimiento: "",
    sexo: "",
    alturaCm: "",
    pesoInicialKg: "",
    factorActividad: "1.55",
    metaPesoKg: "",
    metaGrasaPct: "",
    calibracionPesoKg: "",
    calibracionBmrKcal: "",
  });
  const [eventos, setEventos] = useState<EventoDraft[]>([emptyEvento()]);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Turnstile solo se monta en el último paso: el token vence a los 5 min y completar todo puede tardar más.
  const turnstile = useTurnstile("signup");
  const conTurnstile = mode === "signup" && turnstile.enabled;

  // Al cambiar de paso, foco al primer campo (teclado y lectores de pantalla).
  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>("input, select")?.focus();
  }, [paso]);

  const minNacimiento = toISO(addDays(todayNormalized(), -100 * 365.25));
  const maxNacimiento = toISO(addDays(todayNormalized(), -13 * 365.25));
  const minEventoFecha = toISO(addDays(todayNormalized(), 1));

  function validarPaso(): Errors {
    if (logico === 0) return errorsOf(cuentaSchema.safeParse(cuenta));
    if (logico === 1) return errorsOf(perfilSchema.safeParse(toPerfil(perfil)));
    return errorsOf(eventosSchema.safeParse(toEventos(eventos)), "eventos.");
  }

  function focusPrimerError() {
    requestAnimationFrame(() =>
      formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(),
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validarPaso();
    setErrors(errs);
    if (Object.keys(errs).length) {
      if (errs["eventos."]) toast.error(errs["eventos."]);
      focusPrimerError();
      return;
    }
    if (!ultimo) {
      setPaso(paso + 1);
      return;
    }
    if (conTurnstile && turnstile.verifying) return; // el botón ya está deshabilitado mientras verifica

    setPending(true);
    const perfilData = toPerfil(perfil);
    const eventosData = toEventos(eventos);
    const result =
      mode === "signup"
        ? await registrar({
            cuenta,
            perfil: perfilData,
            eventos: eventosData,
            turnstileToken: turnstile.token,
          })
        : await completeOnboarding({ ...perfilData, eventos: eventosData });

    // Si salió bien, la acción ya redirigió (sin resultado): solo se manejan avisos y errores.
    if (!result) return;
    setPending(false);
    if (result.ok) {
      if (result.message) toast.success(result.message);
      return;
    }
    toast.error(result.message ?? "No se pudo completar el registro.");
    if (conTurnstile) turnstile.reset();
    const volverA = "paso" in result && typeof result.paso === "number" ? result.paso - offset : -1;
    if (volverA >= 0 && volverA !== paso) setPaso(volverA);
  }

  const pw = cuenta.password;
  const requisitos = [
    { ok: pw.length >= 8, label: "8+ caracteres" },
    { ok: /[A-Za-z]/.test(pw), label: "una letra" },
    { ok: /\d/.test(pw), label: "un número" },
    { ok: pw.length > 0 && pw === cuenta.passwordConfirm, label: "Coinciden" },
  ];

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader className="gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <CardTitle className="text-xl">
            {mode === "signup" ? "Crear cuenta" : "Completá tu perfil"}
          </CardTitle>
          <span className="text-sm text-muted-foreground tabular-nums">
            Paso {paso + 1} de {pasos.length}
          </span>
        </div>
        <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${pasos.length}, 1fr)` }}>
          {pasos.map((label, i) => (
            <li key={label} aria-current={i === paso ? "step" : undefined} className="grid gap-1.5">
              <div
                className={cn("h-1.5 rounded-full", i <= paso ? "bg-primary" : "bg-muted")}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "flex items-center gap-1 text-sm",
                  i === paso ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {i < paso && <Check className="size-3.5" aria-hidden="true" />}
                {label}
              </span>
            </li>
          ))}
        </ol>
        <CardDescription>
          {logico === 0 && "Tus datos de acceso."}
          {logico === 1 && "Con esto calculamos tus calorías y armamos tu plan."}
          {logico === 2 && "Las carreras o caminatas para las que vas a entrenar."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form ref={formRef} noValidate className="grid gap-6" onSubmit={handleSubmit}>
          {logico === 0 && (
            <div className="grid gap-4">
              <Field id="nombre" label="Nombre" error={errors.nombre}>
                <Input
                  id="nombre"
                  autoComplete="given-name"
                  value={cuenta.nombre}
                  onChange={(e) => setCuenta({ ...cuenta, nombre: e.target.value })}
                  {...invalid(errors, "nombre", "nombre")}
                />
              </Field>
              <Field id="email" label="Email" error={errors.email}>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={cuenta.email}
                  onChange={(e) => setCuenta({ ...cuenta, email: e.target.value })}
                  {...invalid(errors, "email", "email")}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Los requisitos reemplazan al mensaje de error: muestran qué falta y se tildan al escribir */}
                <Field id="password" label="Contraseña">
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={cuenta.password}
                    onChange={(e) => setCuenta({ ...cuenta, password: e.target.value })}
                    {...invalid(errors, "password", "password")}
                  />
                  <Requisitos
                    id="password-error"
                    items={requisitos.slice(0, 3)}
                    marcar={!!errors.password}
                  />
                </Field>
                <Field id="passwordConfirm" label="Repetir contraseña">
                  <Input
                    id="passwordConfirm"
                    type="password"
                    autoComplete="new-password"
                    value={cuenta.passwordConfirm}
                    onChange={(e) => setCuenta({ ...cuenta, passwordConfirm: e.target.value })}
                    {...invalid(errors, "passwordConfirm", "passwordConfirm")}
                  />
                  <Requisitos
                    id="passwordConfirm-error"
                    items={requisitos.slice(3)}
                    marcar={!!errors.passwordConfirm}
                  />
                </Field>
              </div>
              <div className="grid gap-1.5">
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 accent-primary"
                    checked={cuenta.aceptaTerminos}
                    onChange={(e) => setCuenta({ ...cuenta, aceptaTerminos: e.target.checked })}
                    {...invalid(errors, "aceptaTerminos", "aceptaTerminos")}
                  />
                  <span>
                    Acepto los{" "}
                    <Link
                      href="/privacidad"
                      target="_blank"
                      className="font-semibold underline underline-offset-2"
                    >
                      términos y la política de privacidad
                    </Link>
                    .
                  </span>
                </label>
                {errors.aceptaTerminos && (
                  <p id="aceptaTerminos-error" className="text-sm text-destructive">
                    {errors.aceptaTerminos}
                  </p>
                )}
              </div>
            </div>
          )}

          {logico === 1 && (
            <div className="grid gap-4">
              <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 md:grid-cols-3">
                <Field
                  id="fechaNacimiento"
                  label="Fecha de nacimiento"
                  error={errors.fechaNacimiento}
                >
                  <Input
                    id="fechaNacimiento"
                    type="date"
                    min={minNacimiento}
                    max={maxNacimiento}
                    autoComplete="bday"
                    value={perfil.fechaNacimiento}
                    onChange={(e) => setPerfil({ ...perfil, fechaNacimiento: e.target.value })}
                    {...invalid(errors, "fechaNacimiento", "fechaNacimiento")}
                  />
                </Field>
                <Field id="sexo" label="Sexo" error={errors.sexo}>
                  <Opciones
                    id="sexo"
                    items={SEXO}
                    placeholder="Elegí una opción"
                    value={perfil.sexo}
                    onChange={(sexo) => setPerfil({ ...perfil, sexo })}
                    {...invalid(errors, "sexo", "sexo")}
                  />
                </Field>
                <Field id="alturaCm" label="Altura (cm)" error={errors.alturaCm}>
                  <Input
                    id="alturaCm"
                    type="number"
                    inputMode="numeric"
                    min="100"
                    max="250"
                    value={perfil.alturaCm}
                    onChange={(e) => setPerfil({ ...perfil, alturaCm: e.target.value })}
                    {...invalid(errors, "alturaCm", "alturaCm")}
                  />
                </Field>
                <Field id="pesoInicialKg" label="Peso actual (kg)" error={errors.pesoInicialKg}>
                  <Input
                    id="pesoInicialKg"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="30"
                    max="300"
                    value={perfil.pesoInicialKg}
                    onChange={(e) => setPerfil({ ...perfil, pesoInicialKg: e.target.value })}
                    {...invalid(errors, "pesoInicialKg", "pesoInicialKg")}
                  />
                </Field>
                <Field id="metaPesoKg" label="Meta de peso (opcional)" error={errors.metaPesoKg}>
                  <Input
                    id="metaPesoKg"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="30"
                    max="300"
                    placeholder="kg"
                    value={perfil.metaPesoKg}
                    onChange={(e) => setPerfil({ ...perfil, metaPesoKg: e.target.value })}
                    {...invalid(errors, "metaPesoKg", "metaPesoKg")}
                  />
                </Field>
                <Field
                  id="metaGrasaPct"
                  label="Meta de % grasa (opcional)"
                  error={errors.metaGrasaPct}
                >
                  <Input
                    id="metaGrasaPct"
                    placeholder="ej. 14-15%"
                    value={perfil.metaGrasaPct}
                    onChange={(e) => setPerfil({ ...perfil, metaGrasaPct: e.target.value })}
                  />
                </Field>
                <Field
                  id="factorActividad"
                  label="Nivel de actividad"
                  className="sm:col-span-2 md:col-span-3"
                >
                  <Opciones
                    id="factorActividad"
                    items={ACTIVIDAD}
                    value={perfil.factorActividad}
                    onChange={(factorActividad) => setPerfil({ ...perfil, factorActividad })}
                  />
                </Field>
              </div>
              <details className="rounded-lg border border-border p-3">
                <summary className="cursor-pointer text-sm font-medium">
                  Calibración personal (opcional, ej. medición InBody)
                </summary>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <Field
                    id="calibracionPesoKg"
                    label="Peso en la medición (kg)"
                    error={errors.calibracionPesoKg}
                  >
                    <Input
                      id="calibracionPesoKg"
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      value={perfil.calibracionPesoKg}
                      onChange={(e) => setPerfil({ ...perfil, calibracionPesoKg: e.target.value })}
                      {...invalid(errors, "calibracionPesoKg", "calibracionPesoKg")}
                    />
                  </Field>
                  <Field
                    id="calibracionBmrKcal"
                    label="BMR medido (kcal)"
                    error={errors.calibracionBmrKcal}
                  >
                    <Input
                      id="calibracionBmrKcal"
                      type="number"
                      inputMode="numeric"
                      value={perfil.calibracionBmrKcal}
                      onChange={(e) => setPerfil({ ...perfil, calibracionBmrKcal: e.target.value })}
                      {...invalid(errors, "calibracionBmrKcal", "calibracionBmrKcal")}
                    />
                  </Field>
                </div>
              </details>
            </div>
          )}

          {logico === 2 && (
            <div className="grid gap-3">
              {eventos.map((ev, i) => {
                const k = (f: string) => `eventos.${i}.${f}`;
                const set = (patch: Partial<EventoDraft>) =>
                  setEventos((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
                return (
                  <fieldset
                    key={i}
                    className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-6"
                  >
                    <legend className="px-1 text-sm font-medium">Evento {i + 1}</legend>
                    <Field id={`tipo-${i}`} label="Tipo" className="sm:col-span-2">
                      <Opciones
                        id={`tipo-${i}`}
                        items={TIPO_EVENTO}
                        value={ev.tipo}
                        onChange={(tipo) => set({ tipo: tipo as EventoDraft["tipo"] })}
                      />
                    </Field>
                    <Field
                      id={`nombre-${i}`}
                      label="Nombre"
                      error={errors[k("nombre")]}
                      className="sm:col-span-4"
                    >
                      <Input
                        id={`nombre-${i}`}
                        placeholder="ej. 10K del club"
                        value={ev.nombre}
                        onChange={(e) => set({ nombre: e.target.value })}
                        {...invalid(errors, k("nombre"), `nombre-${i}`)}
                      />
                    </Field>
                    <Field
                      id={`fecha-${i}`}
                      label="Fecha"
                      error={errors[k("fecha")]}
                      className="sm:col-span-3"
                    >
                      <Input
                        id={`fecha-${i}`}
                        type="date"
                        min={minEventoFecha}
                        value={ev.fecha}
                        onChange={(e) => set({ fecha: e.target.value })}
                        {...invalid(errors, k("fecha"), `fecha-${i}`)}
                      />
                    </Field>
                    <div className="flex items-start gap-2 sm:col-span-3">
                      <Field
                        id={`km-${i}`}
                        label="Distancia (km)"
                        error={errors[k("distanciaKm")]}
                        className="flex-1"
                      >
                        <Input
                          id={`km-${i}`}
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          min="0"
                          value={ev.distanciaKm}
                          onChange={(e) => set({ distanciaKm: e.target.value })}
                          {...invalid(errors, k("distanciaKm"), `km-${i}`)}
                        />
                      </Field>
                      {eventos.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="mt-6"
                          aria-label={`Quitar evento ${i + 1}`}
                          onClick={() => setEventos((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </fieldset>
                );
              })}
              <Button
                type="button"
                variant="outline"
                className="justify-self-start"
                onClick={() => setEventos((prev) => [...prev, emptyEvento()])}
              >
                <Plus aria-hidden="true" /> Agregar otro evento
              </Button>
              {conTurnstile && turnstile.widget}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            {paso > 0 ? (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  setErrors({});
                  setPaso(paso - 1);
                }}
              >
                Atrás
              </Button>
            ) : (
              <span />
            )}
            <Button
              type="submit"
              disabled={pending || (ultimo && conTurnstile && turnstile.verifying)}
            >
              {!ultimo
                ? "Siguiente"
                : pending
                  ? "Creando tu plan…"
                  : conTurnstile && turnstile.verifying
                    ? "Verificando…"
                    : mode === "signup"
                      ? "Crear cuenta y armar mi plan"
                      : "Armar mi plan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
