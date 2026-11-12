"use client";

/**
 * Campos de perfil, disponibilidad y evento: los comparten el registro en pasos
 * (components/registro/registro-wizard.tsx) y Mi perfil (app/(app)/perfil). Los borradores
 * guardan strings (lo que tiene cada input); toPerfil/toEvento los pasan al formato de zod.
 */
import type { z } from "zod";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Opciones } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { addDays, toISO, todayNormalized } from "@/lib/date";
import { formatPace } from "@/lib/pace";
import type { UserEvent } from "@/lib/training-plan";
import type { Perfil } from "@/lib/user-plan";

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
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MINUTOS = [
  { value: 30, label: "30 min", hint: "Lo esencial" },
  { value: 45, label: "45 min", hint: "Una sesión por día" },
  { value: 60, label: "60 min", hint: "Plan completo" },
  { value: 90, label: "90 min", hint: "Plan completo, sin apuro" },
];

export interface PerfilDraft {
  fechaNacimiento: string;
  sexo: string;
  alturaCm: string;
  pesoInicialKg: string;
  factorActividad: string;
  metaPesoKg: string;
  metaGrasaPct: string;
  calibracionPesoKg: string;
  calibracionBmrKcal: string;
  diasEntrenamiento: number[];
  minutosSesion: number;
}

export interface EventoDraft {
  tipo: "carrera" | "caminata";
  nombre: string;
  fecha: string;
  distanciaKm: string;
  /** "m:ss" por km, opcional (solo carreras) */
  ritmo: string;
}

export type Errors = Record<string, string>;

export const emptyPerfil = (): PerfilDraft => ({
  fechaNacimiento: "",
  sexo: "",
  alturaCm: "",
  pesoInicialKg: "",
  factorActividad: "1.55",
  metaPesoKg: "",
  metaGrasaPct: "",
  calibracionPesoKg: "",
  calibracionBmrKcal: "",
  diasEntrenamiento: [0, 1, 2, 3, 4, 5],
  minutosSesion: 60,
});

export const emptyEvento = (): EventoDraft => ({
  tipo: "carrera",
  nombre: "",
  fecha: "",
  distanciaKm: "",
  ritmo: "",
});

const str = (n: number | null | undefined) => (n == null ? "" : String(n));

/** Perfil guardado → borrador editable (Mi perfil). */
export function perfilADraft(p: Perfil): PerfilDraft {
  return {
    fechaNacimiento: p.fechaNacimiento ?? "",
    sexo: p.sexo,
    alturaCm: str(p.alturaCm),
    pesoInicialKg: str(p.pesoInicialKg),
    factorActividad: str(p.factorActividad),
    metaPesoKg: str(p.metaPesoKg),
    metaGrasaPct: p.metaGrasaPct ?? "",
    calibracionPesoKg: str(p.calibracionPesoKg),
    calibracionBmrKcal: str(p.calibracionBmrKcal),
    diasEntrenamiento: p.disponibilidad.dias,
    minutosSesion: p.disponibilidad.minutos,
  };
}

export function eventoADraft(e: UserEvent): EventoDraft {
  return {
    tipo: e.tipo,
    nombre: e.nombre,
    fecha: e.fecha,
    distanciaKm: str(e.distanciaKm),
    ritmo: e.ritmoObjetivoSeg ? formatPace(e.ritmoObjetivoSeg).replace("/km", "") : "",
  };
}

/** "6:30" → 390 segundos; NaN si el formato no sirve (zod muestra el error). */
function ritmoASegundos(ritmo: string): number {
  const m = /^(\d{1,2}):([0-5]\d)$/.exec(ritmo.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
}
const num = (s: string) => (s.trim() === "" ? undefined : Number(s));

export function toPerfil(p: PerfilDraft) {
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
    diasEntrenamiento: p.diasEntrenamiento,
    minutosSesion: p.minutosSesion,
  };
}

export function toEvento(e: EventoDraft) {
  return {
    tipo: e.tipo,
    nombre: e.nombre.trim(),
    fecha: e.fecha,
    distanciaKm: num(e.distanciaKm),
    ritmoObjetivoSeg: e.tipo === "carrera" && e.ritmo.trim() ? ritmoASegundos(e.ritmo) : null,
  };
}

/** Errores de zod → { "campo": "mensaje" } (primer error de cada campo). */
export function errorsOf(result: z.ZodSafeParseResult<unknown>, prefix = ""): Errors {
  if (result.success) return {};
  const out: Errors = {};
  for (const issue of result.error.issues) {
    const key = prefix + issue.path.join(".");
    out[key] ??= issue.message;
  }
  return out;
}

export function Field({
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

/** Para pasar a cada input: marca inválido y lo vincula a su mensaje. */
export const invalid = (errors: Errors, key: string, id: string) =>
  errors[key] ? { "aria-invalid": true, "aria-describedby": `${id}-error` } : {};

export function CamposPerfil({
  perfil,
  setPerfil,
  errors,
}: {
  perfil: PerfilDraft;
  setPerfil: (p: PerfilDraft) => void;
  errors: Errors;
}) {
  const minNacimiento = toISO(addDays(todayNormalized(), -100 * 365.25));
  const maxNacimiento = toISO(addDays(todayNormalized(), -13 * 365.25));

  return (
    <div className="grid gap-4">
      <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 md:grid-cols-3">
        <Field id="fechaNacimiento" label="Fecha de nacimiento" error={errors.fechaNacimiento}>
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
        <Field id="metaGrasaPct" label="Meta de % grasa (opcional)" error={errors.metaGrasaPct}>
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
  );
}

/** Días de la semana (toggle) + minutos por sesión: de acá sale el reparto del plan. */
export function CamposDisponibilidad({
  perfil,
  setPerfil,
  errors,
}: {
  perfil: PerfilDraft;
  setPerfil: (p: PerfilDraft) => void;
  errors: Errors;
}) {
  const dias = perfil.diasEntrenamiento;
  const toggle = (d: number) =>
    setPerfil({
      ...perfil,
      diasEntrenamiento: dias.includes(d)
        ? dias.filter((x) => x !== d)
        : [...dias, d].sort((a, b) => a - b),
    });

  return (
    <div className="grid gap-5">
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">¿Qué días podés entrenar?</legend>
        <div className="grid grid-cols-7 gap-1.5">
          {DIAS.map((label, d) => {
            const on = dias.includes(d);
            return (
              <button
                key={label}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(d)}
                className={cn(
                  "rounded-lg border py-2.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
        {errors.diasEntrenamiento ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.diasEntrenamiento}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {dias.length} {dias.length === 1 ? "día" : "días"} por semana. La salida larga va al
            último día que elijas; si son menos días que el plan, se priorizan las sesiones clave
            para tus eventos.
          </p>
        )}
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">¿Cuánto tiempo tenés por sesión?</legend>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {MINUTOS.map(({ value, label, hint }) => {
            const on = perfil.minutosSesion === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={on}
                onClick={() => setPerfil({ ...perfil, minutosSesion: value })}
                className={cn(
                  "grid gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  on ? "border-primary bg-primary/10" : "border-border hover:bg-muted",
                )}
              >
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-muted-foreground">{hint}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

/** Campos de un evento. `k(campo)` arma la clave de error (ej. "eventos.0.nombre" o "nombre"). */
export function CamposEvento({
  ev,
  set,
  errors,
  idSuffix,
  k,
  onRemove,
  removeLabel,
}: {
  ev: EventoDraft;
  set: (patch: Partial<EventoDraft>) => void;
  errors: Errors;
  idSuffix: string;
  k: (campo: string) => string;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  const minEventoFecha = toISO(addDays(todayNormalized(), 1));
  const id = (campo: string) => `${campo}-${idSuffix}`;

  return (
    <div className="grid gap-3 sm:grid-cols-6">
      <Field id={id("tipo")} label="Tipo" className="sm:col-span-2">
        <Opciones
          id={id("tipo")}
          items={TIPO_EVENTO}
          value={ev.tipo}
          onChange={(tipo) => set({ tipo: tipo as EventoDraft["tipo"] })}
        />
      </Field>
      <Field id={id("nombre")} label="Nombre" error={errors[k("nombre")]} className="sm:col-span-4">
        <Input
          id={id("nombre")}
          placeholder="ej. 10K del club"
          value={ev.nombre}
          onChange={(e) => set({ nombre: e.target.value })}
          {...invalid(errors, k("nombre"), id("nombre"))}
        />
      </Field>
      <Field id={id("fecha")} label="Fecha" error={errors[k("fecha")]} className="sm:col-span-2">
        <Input
          id={id("fecha")}
          type="date"
          min={minEventoFecha}
          value={ev.fecha}
          onChange={(e) => set({ fecha: e.target.value })}
          {...invalid(errors, k("fecha"), id("fecha"))}
        />
      </Field>
      <div className="flex items-start gap-2 sm:col-span-4">
        <Field
          id={id("km")}
          label="Distancia (km)"
          error={errors[k("distanciaKm")]}
          className="flex-1"
        >
          <Input
            id={id("km")}
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={ev.distanciaKm}
            onChange={(e) => set({ distanciaKm: e.target.value })}
            {...invalid(errors, k("distanciaKm"), id("km"))}
          />
        </Field>
        {ev.tipo === "carrera" && (
          <Field
            id={id("ritmo")}
            label="Ritmo objetivo (opcional)"
            error={errors[k("ritmoObjetivoSeg")]}
            className="flex-1"
          >
            <Input
              id={id("ritmo")}
              inputMode="numeric"
              placeholder="min/km, ej. 6:30"
              value={ev.ritmo}
              onChange={(e) => set({ ritmo: e.target.value })}
              {...invalid(errors, k("ritmoObjetivoSeg"), id("ritmo"))}
            />
          </Field>
        )}
        {onRemove && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="mt-6"
            aria-label={removeLabel}
            onClick={onRemove}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
