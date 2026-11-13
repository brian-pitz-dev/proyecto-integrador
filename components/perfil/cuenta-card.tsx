"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Download, KeyRound, Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  actualizarClave,
  actualizarEmail,
  borrarCuenta,
  confirmarClave,
} from "@/app/(app)/perfil/actions";
import type { ActionResult } from "@/lib/types";

type Accion = "email" | "clave" | "borrar" | "exportar";

/** POST con la contraseña (app/(app)/perfil/exportar/route.ts) y descarga del JSON que vuelve. */
async function exportarDatos(datos: Record<string, string>): Promise<ActionResult> {
  const res = await fetch("/perfil/exportar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: datos.password }),
  }).catch(() => null);
  if (!res) return { ok: false, message: "No se pudo conectar, probá de nuevo." };
  if (!res.ok) {
    const body: { error?: string } | null = await res.json().catch(() => null);
    return { ok: false, message: body?.error ?? "No se pudieron exportar los datos." };
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download =
    /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? "bakata.json";
  a.click();
  URL.revokeObjectURL(url);
  return { ok: true, message: "Listo, se descargaron tus datos." };
}

/** Avisos al volver del link de cambio de email (app/auth/confirm/route.ts). */
const AVISOS_EMAIL: Record<string, { error?: boolean; texto: string }> = {
  ok: { texto: "Listo, tu email cambió." },
  "falta-otro": { texto: "Confirmado. Falta que abras el link que te llegó al otro email." },
  error: { error: true, texto: "El link para cambiar el email venció o ya se usó. Pedí otro." },
};

/** Email, contraseña, descargar los datos y dar de baja la cuenta (ver /privacidad). */
export function CuentaCard({ email }: { email: string }) {
  const [abierta, setAbiertaState] = useState<Accion | null>(null);
  const [pending, setPending] = useState(false);
  // cada formulario arranca solo con la contraseña actual; el resto se habilita si es correcta
  const [verificada, setVerificada] = useState(false);
  const siguienteRef = useRef<HTMLInputElement>(null);
  const aviso = AVISOS_EMAIL[useSearchParams().get("email") ?? ""];

  useEffect(() => {
    if (verificada) siguienteRef.current?.focus();
  }, [verificada]);

  function setAbierta(accion: Accion | null) {
    setVerificada(false);
    setAbiertaState(accion);
  }

  async function enviar(
    event: React.FormEvent<HTMLFormElement>,
    campoClave: string,
    accion: (datos: Record<string, string>) => Promise<ActionResult>,
    { enDosPasos = true } = {},
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    const datos = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const limpiarClave = () => {
      const input = form.elements.namedItem(campoClave) as HTMLInputElement;
      input.value = "";
      input.focus();
    };

    if (enDosPasos && !verificada) {
      const result = await confirmarClave(datos[campoClave]);
      setPending(false);
      if (result.ok) return setVerificada(true);
      toast.error(result.message ?? "Contraseña incorrecta.");
      return limpiarClave();
    }

    const result = await accion(datos);
    // borrarCuenta, si sale bien, ya redirigió a /login (result undefined): queda el spinner
    if (!result) return;
    setPending(false);
    if (result.ok) {
      toast.success(result.message ?? "Listo.");
      setAbierta(null);
    } else {
      toast.error(result.message ?? "No se pudo guardar.");
      // en un solo paso la contraseña recién se valida acá
      if (!enDosPasos) limpiarClave();
    }
  }

  const cancelar = (
    <Button type="button" variant="outline" disabled={pending} onClick={() => setAbierta(null)}>
      Cancelar
    </Button>
  );
  // los gestores de contraseñas asocian la clave con este usuario
  const usuario = <input type="hidden" name="username" autoComplete="username" value={email} />;

  // readOnly y no disabled: un campo disabled no viaja en el FormData del segundo paso
  const claveActual = (id: string, name: string, label: string) => (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type="password"
        autoComplete="current-password"
        required
        autoFocus
        readOnly={verificada}
        aria-describedby={verificada ? `${id}-ok` : undefined}
      />
      {verificada && (
        <p id={`${id}-ok`} className="text-xs text-muted-foreground">
          Contraseña correcta.
        </p>
      )}
    </div>
  );

  const textoBoton = (listo: string, enCurso: string) =>
    pending ? (verificada ? enCurso : "Verificando…") : verificada ? listo : "Continuar";

  // mientras se envía no se cierra: si no, el resultado llegaría a un formulario que ya no está
  const alCerrar = (open: boolean) => !open && !pending && setAbierta(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tu cuenta</CardTitle>
        <CardDescription>Tu acceso, y tus datos: podés llevártelos o borrarlos.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        {aviso && (
          <p
            role={aviso.error ? "alert" : "status"}
            className={
              aviso.error
                ? "rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
                : "rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm"
            }
          >
            {aviso.texto}
          </p>
        )}

        <div className="grid gap-2">
          <p className="text-sm text-muted-foreground">
            Entrás con <span className="font-medium text-foreground">{email}</span>.
          </p>
          {abierta === "email" ? (
            <form
              className="grid max-w-sm gap-3 rounded-xl border p-4"
              onSubmit={(e) => enviar(e, "password", actualizarEmail)}
            >
              {usuario}
              {claveActual("email-password", "password", "Tu contraseña")}
              <div className="grid gap-1.5">
                <Label htmlFor="nuevo-email">Email nuevo</Label>
                <Input
                  ref={siguienteRef}
                  id="nuevo-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={!verificada}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Te mandamos un link para confirmarlo. Hasta que lo abras, seguís entrando con el
                email de ahora.
              </p>
              <div className="flex gap-2">
                <Button type="submit" loading={pending}>
                  {textoBoton("Cambiar email", "Enviando…")}
                </Button>
                {cancelar}
              </div>
            </form>
          ) : abierta === "clave" ? (
            <form
              className="grid max-w-sm gap-3 rounded-xl border p-4"
              onSubmit={(e) => enviar(e, "actual", actualizarClave)}
            >
              {usuario}
              {claveActual("clave-actual", "actual", "Contraseña actual")}
              <div className="grid gap-1.5">
                <Label htmlFor="clave-nueva">Contraseña nueva</Label>
                <Input
                  ref={siguienteRef}
                  id="clave-nueva"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={!verificada}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="clave-repetir">Repetila</Label>
                <Input
                  id="clave-repetir"
                  name="passwordConfirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={!verificada}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Al menos 8 caracteres, con letras y números. Se cierran tus sesiones en otros
                dispositivos.
              </p>
              <div className="flex gap-2">
                <Button type="submit" loading={pending}>
                  {textoBoton("Cambiar contraseña", "Guardando…")}
                </Button>
                {cancelar}
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setAbierta("email")}>
                <Mail aria-hidden="true" /> Cambiar email
              </Button>
              <Button variant="outline" onClick={() => setAbierta("clave")}>
                <KeyRound aria-hidden="true" /> Cambiar contraseña
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-2 border-t pt-5">
          <p className="text-sm text-muted-foreground">
            Un archivo con tu perfil, tus eventos, todo lo que registraste, tus fotos y tus planes
            del Coach.
          </p>
          <Button
            variant="outline"
            className="justify-self-start"
            onClick={() => setAbierta("exportar")}
          >
            <Download aria-hidden="true" /> Descargar mis datos
          </Button>
          <Dialog open={abierta === "exportar"} onOpenChange={alCerrar}>
            <DialogContent>
              <form
                className="grid gap-4"
                onSubmit={(e) => enviar(e, "password", exportarDatos, { enDosPasos: false })}
              >
                <DialogHeader>
                  <DialogTitle>Descargar mis datos</DialogTitle>
                  <DialogDescription>
                    Para llevarte tus datos, confirmá que sos vos con tu contraseña.
                  </DialogDescription>
                </DialogHeader>
                {usuario}
                {claveActual("exportar-password", "password", "Tu contraseña")}
                <DialogFooter>
                  {cancelar}
                  <Button type="submit" loading={pending}>
                    {pending ? "Preparando…" : "Descargar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-2 border-t pt-5">
          <p className="text-sm text-muted-foreground">
            Borra tu cuenta, tu perfil, tus eventos, tus registros, tus fotos y tus planes. No se
            puede deshacer.
          </p>
          <Button
            variant="destructive"
            className="justify-self-start"
            onClick={() => setAbierta("borrar")}
          >
            <Trash2 aria-hidden="true" /> Borrar mi cuenta
          </Button>
          <Dialog open={abierta === "borrar"} onOpenChange={alCerrar}>
            <DialogContent>
              <form
                className="grid gap-4"
                onSubmit={(e) => enviar(e, "password", (d) => borrarCuenta(d.password))}
              >
                <DialogHeader>
                  <DialogTitle>¿Borrar tu cuenta?</DialogTitle>
                  <DialogDescription>
                    Se borran tu perfil, tus eventos, tus registros, tus fotos y tus planes. No se
                    puede deshacer.
                  </DialogDescription>
                </DialogHeader>
                {usuario}
                {claveActual("borrar-password", "password", "Escribí tu contraseña para confirmar")}
                <DialogFooter>
                  {cancelar}
                  <Button
                    type="submit"
                    className={
                      verificada ? "bg-destructive text-white hover:bg-destructive/90" : undefined
                    }
                    loading={pending}
                  >
                    {textoBoton("Borrar mi cuenta", "Borrando…")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
