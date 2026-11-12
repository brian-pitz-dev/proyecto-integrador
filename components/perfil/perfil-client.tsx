"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Footprints, Medal, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fromISO, toISO, todayNormalized } from "@/lib/date";
import { formatPace } from "@/lib/pace";
import { eventoSchema, perfilSchema } from "@/lib/validation/onboarding";
import type { UserEvent } from "@/lib/training-plan";
import type { Perfil } from "@/lib/user-plan";
import { actualizarPerfil, borrarEvento, guardarEvento } from "@/app/(app)/perfil/actions";
import { CuentaCard } from "@/components/perfil/cuenta-card";
import {
  CamposDisponibilidad,
  CamposEvento,
  CamposPerfil,
  emptyEvento,
  errorsOf,
  eventoADraft,
  Field,
  invalid,
  perfilADraft,
  toEvento,
  toPerfil,
  type Errors,
  type EventoDraft,
} from "@/components/perfil/campos";

const fechaLarga = (iso: string) =>
  fromISO(iso).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function PerfilClient({
  nombre,
  email,
  perfil,
  events,
}: {
  nombre: string;
  email: string;
  perfil: Perfil;
  events: UserEvent[];
}) {
  const [nombreDraft, setNombre] = useState(nombre);
  const [draft, setDraft] = useState(() => perfilADraft(perfil));
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState<"datos" | "semana" | null>(null);

  async function guardar(seccion: "datos" | "semana") {
    const data = toPerfil(draft);
    const errs = errorsOf(perfilSchema.safeParse(data));
    if (!nombreDraft.trim()) errs.nombre = "Contanos tu nombre";
    setErrors(errs);
    const primero = Object.values(errs)[0];
    if (primero) {
      toast.error(primero);
      return;
    }
    setPending(seccion);
    const result = await actualizarPerfil({ nombre: nombreDraft, perfil: data });
    setPending(null);
    if (!result.ok) {
      toast.error(result.message ?? "No se pudo guardar.");
      return;
    }
    toast.success(
      seccion === "semana" ? "Listo: tu plan se rearmó con tu nueva semana." : "Perfil guardado.",
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
      <div>
        <h1 className="text-4xl font-bold">Mi perfil</h1>
        <p className="max-w-prose text-muted-foreground">
          Tus datos, cuándo podés entrenar y para qué te estás preparando. Al guardar, tu plan y tus
          calorías se recalculan solos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tu semana de entrenamiento</CardTitle>
          <CardDescription>
            Elegí los días y el tiempo que tenés: el plan reparte las sesiones en esos días.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <CamposDisponibilidad perfil={draft} setPerfil={setDraft} errors={errors} />
          <Button
            className="justify-self-start"
            disabled={pending !== null}
            loading={pending === "semana"}
            onClick={() => guardar("semana")}
          >
            {pending === "semana" ? "Rearmando tu plan…" : "Guardar semana"}
          </Button>
        </CardContent>
      </Card>

      <EventosEditor events={events} />

      <Card>
        <CardHeader>
          <CardTitle>Tus datos</CardTitle>
          <CardDescription>Con esto calculamos tus calorías y tus metas.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
            <Field id="nombre" label="Nombre" error={errors.nombre}>
              <Input
                id="nombre"
                autoComplete="given-name"
                value={nombreDraft}
                onChange={(e) => setNombre(e.target.value)}
                {...invalid(errors, "nombre", "nombre")}
              />
            </Field>
            <Field id="email" label="Email" hint="El email de tu cuenta no se puede cambiar acá.">
              <Input id="email" value={email} readOnly disabled />
            </Field>
          </div>
          <CamposPerfil perfil={draft} setPerfil={setDraft} errors={errors} />
          <Button
            className="justify-self-start"
            disabled={pending !== null}
            loading={pending === "datos"}
            onClick={() => guardar("datos")}
          >
            {pending === "datos" ? "Guardando…" : "Guardar datos"}
          </Button>
        </CardContent>
      </Card>

      <CuentaCard email={email} />
    </div>
  );
}

/** Lista de eventos con alta, edición inline y borrado con confirmación. */
function EventosEditor({ events }: { events: UserEvent[] }) {
  // id del evento en edición, "nuevo" para el alta, null si no se edita nada
  const [editando, setEditando] = useState<string | null>(null);
  const [draft, setDraft] = useState<EventoDraft>(emptyEvento);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const [aBorrar, setABorrar] = useState<string | null>(null);

  const hoy = toISO(todayNormalized());
  const ordenados = [...events].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const proximos = ordenados.filter((e) => e.fecha >= hoy);
  const pasados = ordenados.filter((e) => e.fecha < hoy).reverse();

  function abrir(id: string, ev?: UserEvent) {
    setEditando(id);
    setDraft(ev ? eventoADraft(ev) : emptyEvento());
    setErrors({});
    setABorrar(null);
  }

  async function guardar() {
    const data = toEvento(draft);
    const errs = errorsOf(eventoSchema.safeParse(data));
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setPending(true);
    const result = await guardarEvento({
      id: editando === "nuevo" ? null : editando,
      evento: data,
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.message ?? "No se pudo guardar el evento.");
      return;
    }
    toast.success(
      editando === "nuevo" ? "Evento agregado: tu plan ya lo tiene en cuenta." : "Evento guardado.",
    );
    setEditando(null);
  }

  async function borrar(id: string) {
    setPending(true);
    const result = await borrarEvento(id);
    setPending(false);
    setABorrar(null);
    if (result.ok) toast.success("Evento eliminado.");
    else toast.error(result.message ?? "No se pudo borrar el evento.");
  }

  const formulario = (id: string) => (
    <div className="grid gap-4 rounded-xl border border-primary/40 bg-primary/5 p-4">
      <CamposEvento
        ev={draft}
        set={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
        errors={errors}
        idSuffix={id}
        k={(campo) => campo}
      />
      <div className="flex gap-2">
        <Button loading={pending} onClick={guardar}>
          {pending ? "Guardando…" : id === "nuevo" ? "Agregar evento" : "Guardar cambios"}
        </Button>
        <Button variant="outline" disabled={pending} onClick={() => setEditando(null)}>
          Cancelar
        </Button>
      </div>
    </div>
  );

  const fila = (ev: UserEvent, pasado: boolean) => {
    if (editando === ev.id) return <li key={ev.id}>{formulario(ev.id)}</li>;
    const Icon = ev.tipo === "carrera" ? Medal : Footprints;
    return (
      <li
        key={ev.id}
        className={cn(
          "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl p-4 ring-1 ring-foreground/10",
          pasado && "opacity-70",
        )}
      >
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="grid min-w-0 flex-1 gap-0.5">
          <p className="truncate font-semibold">{ev.nombre}</p>
          <p className="text-sm text-muted-foreground">
            {fechaLarga(ev.fecha)} · {ev.distanciaKm} km
            {ev.ritmoObjetivoSeg ? ` · objetivo ${formatPace(ev.ritmoObjetivoSeg)}` : ""}
          </p>
        </div>
        {aBorrar === ev.id ? (
          <div className="flex items-center gap-2" role="group" aria-label="Confirmar borrado">
            <span className="text-sm">¿Eliminar?</span>
            <Button
              size="sm"
              className="bg-destructive text-white hover:bg-destructive/90"
              loading={pending}
              onClick={() => borrar(ev.id)}
            >
              Sí, eliminar
            </Button>
            <Button variant="outline" size="sm" disabled={pending} onClick={() => setABorrar(null)}>
              No
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            {!pasado && (
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={`Editar ${ev.nombre}`}
                onClick={() => abrir(ev.id, ev)}
              >
                <Pencil aria-hidden="true" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={`Eliminar ${ev.nombre}`}
              onClick={() => setABorrar(ev.id)}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        )}
      </li>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tus eventos</CardTitle>
        <CardDescription>
          Las carreras y caminatas para las que entrenás. Cada una arma su bloque de preparación en
          tu plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {proximos.length === 0 && editando !== "nuevo" && (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            No tenés eventos próximos: tu plan queda en mantenimiento hasta que agregues uno.
          </p>
        )}
        <ul className="grid gap-3">{proximos.map((ev) => fila(ev, false))}</ul>
        {editando === "nuevo" ? (
          formulario("nuevo")
        ) : (
          <Button variant="outline" className="justify-self-start" onClick={() => abrir("nuevo")}>
            <Plus aria-hidden="true" /> Agregar evento
          </Button>
        )}
        {pasados.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
              Eventos pasados ({pasados.length})
            </summary>
            <ul className="mt-3 grid gap-3">{pasados.map((ev) => fila(ev, true))}</ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
