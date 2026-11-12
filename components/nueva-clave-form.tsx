"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cambiarClave } from "@/app/nueva-clave/actions";

export function NuevaClaveForm({ email }: { email: string }) {
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const formData = new FormData(event.currentTarget);
    const result = await cambiarClave({
      password: String(formData.get("password") ?? ""),
      passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
    });
    // Si salió bien, la acción ya redirigió: solo se maneja el error.
    if (result && !result.ok) {
      setPending(false);
      toast.error(result.message ?? "No se pudo cambiar la contraseña.");
    }
  }

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>Contraseña nueva</CardTitle>
        <CardDescription>
          Para {email}. Al menos 8 caracteres, con una letra y un número.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {/* el gestor de contraseñas asocia la nueva a esta cuenta */}
          <input type="hidden" name="username" autoComplete="username" value={email} />
          <div className="grid gap-1.5">
            <Label htmlFor="password">Contraseña nueva</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="passwordConfirm">Repetila</Label>
            <Input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>
          <Button type="submit" loading={pending} className="mt-1">
            {pending ? "Guardando…" : "Guardar y entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
