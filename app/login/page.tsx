import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "Iniciar sesión · Bakata",
  description: "Acceso privado para el dueño de la app.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="relative grid min-h-dvh place-items-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="grid w-full max-w-sm gap-6 px-4">
        <h1 className="sr-only">Iniciar sesión</h1>
        <BrandMark />
        <LoginForm />
      </div>
    </div>
  );
}
