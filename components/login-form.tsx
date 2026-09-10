"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { login } from "@/app/login/actions";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          action: string;
          callback: (token: string) => void;
        },
      ) => string;
      reset: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  function renderWidget() {
    if (!TURNSTILE_SITE_KEY || !containerRef.current || !window.turnstile) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      action: "login",
      callback: setTurnstileToken,
    });
  }

  // Poll instead of relying solely on <Script onLoad> — the callback's
  // firing relative to containerRef being attached isn't guaranteed across
  // Next.js's afterInteractive loading strategy and React's mount order.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    const interval = setInterval(() => {
      if (window.turnstile && containerRef.current && !widgetIdRef.current) {
        renderWidget();
        clearInterval(interval);
      }
    }, 150);
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const result = await login({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      turnstileToken,
    });

    setPending(false);

    if (result.ok) {
      router.push("/calendario");
      router.refresh();
    } else {
      toast.error(result.message ?? "No se pudo iniciar sesión.");
      // Turnstile tokens are single-use — get a fresh one before retrying.
      setTurnstileToken("");
      if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-sm">
      {TURNSTILE_SITE_KEY && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" />}
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
          {TURNSTILE_SITE_KEY && <div ref={containerRef} />}
          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
