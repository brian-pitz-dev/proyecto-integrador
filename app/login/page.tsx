import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión · Plan de Vida 2026",
  description: "Acceso privado para el dueño de la app.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="grid gap-4">
        <h1 className="sr-only">Iniciar sesión</h1>
        <LoginForm />
      </div>
    </div>
  );
}
