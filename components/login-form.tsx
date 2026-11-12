"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTurnstile } from "@/components/turnstile";
import { login } from "@/app/login/actions";

export function LoginForm() {
  const [pending, setPending] = useState(false);
  const turnstile = useTurnstile("login");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const result = await login({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      turnstileToken: turnstile.token,
    });

    // Si salió bien, la acción ya redirigió (sin resultado): solo se maneja el error.
    if (result && !result.ok) {
      setPending(false);
      toast.error(result.message ?? "No se pudo iniciar sesión.");
      turnstile.reset();
    }
  }

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="username" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {turnstile.widget}
          <Button type="submit" disabled={pending || turnstile.verifying} className="mt-1">
            {pending ? "Ingresando…" : turnstile.verifying ? "Verificando…" : "Ingresar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
