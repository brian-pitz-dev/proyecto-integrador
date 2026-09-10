import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Iniciar sesión · Plan de Vida 2026",
  description: "Acceso privado para el dueño de la app.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="relative grid min-h-dvh place-items-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="grid gap-4">
        <h1 className="sr-only">Iniciar sesión</h1>
        <LoginForm />
      </div>
    </div>
  );
}
