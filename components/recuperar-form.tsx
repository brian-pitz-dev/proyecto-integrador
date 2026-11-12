"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTurnstile } from "@/components/turnstile";
import { pedirRecuperacion } from "@/app/recuperar/actions";

export function RecuperarForm() {
  const [pending, setPending] = useState(false);
  const [enviado, setEnviado] = useState<string | null>(null);
  const turnstile = useTurnstile("recuperar");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    const result = await pedirRecuperacion({ email, turnstileToken: turnstile.token });
    setPending(false);
    if (result.ok) {
      setEnviado(email);
      return;
    }
    toast.error(result.message ?? "No se pudo mandar el mail.");
    turnstile.reset();
  }

  if (enviado) {
    return (
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle>Revisá tu mail</CardTitle>
          <CardDescription>
            Si hay una cuenta con <strong className="text-foreground">{enviado}</strong>, te
            mandamos un link para elegir una contraseña nueva. Abrilo en este mismo navegador.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>Recuperar contraseña</CardTitle>
        <CardDescription>Te mandamos un link para elegir una contraseña nueva.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="username" required />
          </div>
          {turnstile.widget}
          <Button type="submit" loading={pending || turnstile.verifying} className="mt-1">
            {pending ? "Enviando…" : turnstile.verifying ? "Verificando…" : "Mandar link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
