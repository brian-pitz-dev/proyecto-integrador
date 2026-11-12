"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { borrarCuenta } from "@/app/(app)/perfil/actions";

/** Descargar los datos y dar de baja la cuenta (derechos de acceso y supresión, ver /privacidad). */
export function CuentaCard({ email }: { email: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const result = await borrarCuenta(String(new FormData(event.currentTarget).get("password")));
    // Si salió bien, la acción ya redirigió a /login.
    if (result && !result.ok) {
      setPending(false);
      toast.error(result.message ?? "No se pudo borrar la cuenta.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tu cuenta</CardTitle>
        <CardDescription>Tus datos son tuyos: podés llevártelos o borrarlos.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-2">
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
          {confirmando ? (
            <form
              className="grid max-w-sm gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4"
              onSubmit={handleSubmit}
            >
              <input type="hidden" name="username" autoComplete="username" value={email} />
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
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setConfirmando(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <Button
              variant="destructive"
              className="justify-self-start"
              onClick={() => setConfirmando(true)}
            >
              <Trash2 aria-hidden="true" /> Borrar mi cuenta
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
