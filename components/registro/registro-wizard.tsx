"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, MailCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTurnstile } from "@/components/turnstile";
import {
  CamposDisponibilidad,
  CamposEvento,
  CamposPerfil,
  emptyEvento,
  emptyPerfil,
  errorsOf,
  Field,
  invalid,
  toEvento,
  toPerfil,
  type Errors,
  type EventoDraft,
  type PerfilDraft,
} from "@/components/perfil/campos";
import { cuentaSchema, eventosSchema, perfilSchema } from "@/lib/validation/onboarding";
import { registrar } from "@/app/signup/actions";
import { completeOnboarding } from "@/app/onboarding/actions";

interface Cuenta {
  nombre: string;
  email: string;
  password: string;
  passwordConfirm: string;
  aceptaTerminos: boolean;
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
  const [perfil, setPerfil] = useState<PerfilDraft>(emptyPerfil);
  const [eventos, setEventos] = useState<EventoDraft[]>([emptyEvento()]);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  // email al que se mandó el link de confirmación: reemplaza el formulario por el aviso
  const [enviadoA, setEnviadoA] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Turnstile solo se monta en el último paso: el token vence a los 5 min y completar todo puede tardar más.
  const turnstile = useTurnstile("signup");
  const conTurnstile = mode === "signup" && turnstile.enabled;

  // Al cambiar de paso, foco al primer campo (teclado y lectores de pantalla).
  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>("input, select")?.focus();
  }, [paso]);

  function validarPaso(): Errors {
    if (logico === 0) return errorsOf(cuentaSchema.safeParse(cuenta));
    if (logico === 1) return errorsOf(perfilSchema.safeParse(toPerfil(perfil)));
    return errorsOf(eventosSchema.safeParse(eventos.map(toEvento)), "eventos.");
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
    const eventosData = eventos.map(toEvento);
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
      if ("confirmar" in result && typeof result.confirmar === "string")
        setEnviadoA(result.confirmar);
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

  if (enviadoA) {
    return (
      <Card className="mx-auto w-full max-w-lg text-center">
        <CardContent className="grid justify-items-center gap-4 py-4" role="status">
          <div className="grid size-12 place-items-center rounded-full bg-primary/15 text-primary">
            <MailCheck className="size-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">Revisá tu email</CardTitle>
          <p className="text-muted-foreground">
            Te mandamos un link a <strong className="text-foreground">{enviadoA}</strong> para
            activar tu cuenta. Abrilo y entrás directo a tu plan: tu perfil y tus eventos ya
            quedaron guardados.
          </p>
          <p className="text-sm text-muted-foreground">
            ¿No llegó? Revisá la carpeta de spam. El link sirve una sola vez.
          </p>
        </CardContent>
      </Card>
    );
  }

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
            <div className="grid gap-6">
              <CamposPerfil perfil={perfil} setPerfil={setPerfil} errors={errors} />
              <section className="grid gap-3 border-t border-border pt-5">
                <h3 className="font-heading text-base font-semibold">Tu semana de entrenamiento</h3>
                <CamposDisponibilidad perfil={perfil} setPerfil={setPerfil} errors={errors} />
              </section>
            </div>
          )}

          {logico === 2 && (
            <div className="grid gap-3">
              {eventos.map((ev, i) => {
                const k = (f: string) => `eventos.${i}.${f}`;
                const set = (patch: Partial<EventoDraft>) =>
                  setEventos((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
                return (
                  <fieldset key={i} className="rounded-lg border border-border p-3">
                    <legend className="px-1 text-sm font-medium">Evento {i + 1}</legend>
                    <CamposEvento
                      ev={ev}
                      set={set}
                      errors={errors}
                      idSuffix={String(i)}
                      k={k}
                      onRemove={
                        eventos.length > 1
                          ? () => setEventos((prev) => prev.filter((_, idx) => idx !== i))
                          : undefined
                      }
                      removeLabel={`Quitar evento ${i + 1}`}
                    />
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
              loading={pending || (ultimo && conTurnstile && turnstile.verifying)}
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
