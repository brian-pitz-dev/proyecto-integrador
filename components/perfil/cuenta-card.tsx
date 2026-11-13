"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Download, KeyRound, Mail, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { actualizarClave, actualizarEmail, borrarCuenta } from "@/app/(app)/perfil/actions";
import type { ActionResult } from "@/lib/types";

type Accion = "email" | "clave" | "borrar";

/** Avisos al volver del link de cambio de email (app/auth/confirm/route.ts). */
const AVISOS_EMAIL: Record<string, { error?: boolean; texto: string }> = {
  ok: { texto: "Listo, tu email cambió." },
  "falta-otro": { texto: "Confirmado. Falta que abras el link que te llegó al otro email." },
  error: { error: true, texto: "El link para cambiar el email venció o ya se usó. Pedí otro." },
};

/** Email, contraseña, descargar los datos y dar de baja la cuenta (ver /privacidad). */
export function CuentaCard({ email }: { email: string }) {
  const [abierta, setAbierta] = useState<Accion | null>(null);
  const [pending, setPending] = useState(false);
  const aviso = AVISOS_EMAIL[useSearchParams().get("email") ?? ""];

  async function enviar(
    event: React.FormEvent<HTMLFormElement>,
    accion: (datos: Record<string, string>) => Promise<ActionResult>,
  ) {
    event.preventDefault();
    setPending(true);
    const datos = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const result = await accion(datos);
    // borrarCuenta, si sale bien, ya redirigió a /login (result undefined): queda el spinner
    if (!result) return;
    setPending(false);
    if (result.ok) {
      toast.success(result.message ?? "Listo.");
      setAbierta(null);
    } else toast.error(result.message ?? "No se pudo guardar.");
  }

  const cancelar = (
    <Button type="button" variant="outline" disabled={pending} onClick={() => setAbierta(null)}>
      Cancelar
    </Button>
  );
  // los gestores de contraseñas asocian la clave con este usuario
  const usuario = <input type="hidden" name="username" autoComplete="username" value={email} />;

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
              onSubmit={(e) => enviar(e, actualizarEmail)}
            >
              {usuario}
              <div className="grid gap-1.5">
                <Label htmlFor="nuevo-email">Email nuevo</Label>
                <Input
                  id="nuevo-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  autoFocus
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email-password">Tu contraseña</Label>
                <Input
                  id="email-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Te mandamos un link para confirmarlo. Hasta que lo abras, seguís entrando con el
                email de ahora.
              </p>
              <div className="flex gap-2">
                <Button type="submit" loading={pending}>
                  {pending ? "Enviando…" : "Cambiar email"}
                </Button>
                {cancelar}
              </div>
            </form>
          ) : abierta === "clave" ? (
            <form
              className="grid max-w-sm gap-3 rounded-xl border p-4"
              onSubmit={(e) => enviar(e, actualizarClave)}
            >
              {usuario}
              <div className="grid gap-1.5">
                <Label htmlFor="clave-actual">Contraseña actual</Label>
                <Input
                  id="clave-actual"
                  name="actual"
                  type="password"
                  autoComplete="current-password"
                  required
                  autoFocus
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="clave-nueva">Contraseña nueva</Label>
                <Input
                  id="clave-nueva"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
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
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Al menos 8 caracteres, con letras y números. Se cierran tus sesiones en otros
                dispositivos.
              </p>
              <div className="flex gap-2">
                <Button type="submit" loading={pending}>
                  {pending ? "Guardando…" : "Cambiar contraseña"}
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
            Un archivo con tu perfil, tus eventos, todo lo que registraste y tus planes del Coach.
          </p>
          {/* <a> y no fetch: la descarga la maneja el navegador con el Content-Disposition */}
          <a
            href="/perfil/exportar"
            download
            className={buttonVariants({ variant: "outline", className: "justify-self-start" })}
          >
            <Download aria-hidden="true" /> Descargar mis datos
          </a>
        </div>

        <div className="grid gap-2 border-t pt-5">
          <p className="text-sm text-muted-foreground">
            Borra tu cuenta, tu perfil, tus eventos, tus registros y tus planes. No se puede
            deshacer.
          </p>
          {abierta === "borrar" ? (
            <form
              className="grid max-w-sm gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4"
              onSubmit={(e) => enviar(e, (d) => borrarCuenta(d.password))}
            >
              {usuario}
              <div className="grid gap-1.5">
                <Label htmlFor="borrar-password">Escribí tu contraseña para confirmar</Label>
                <Input
                  id="borrar-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-destructive text-white hover:bg-destructive/90"
                  loading={pending}
                >
                  {pending ? "Borrando…" : "Borrar mi cuenta"}
                </Button>
                {cancelar}
              </div>
            </form>
          ) : (
            <Button
              variant="destructive"
              className="justify-self-start"
              onClick={() => setAbierta("borrar")}
            >
              <Trash2 aria-hidden="true" /> Borrar mi cuenta
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
