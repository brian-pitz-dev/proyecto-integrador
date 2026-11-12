import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "Iniciar sesión · Bakata",
  description: "Iniciá sesión en Bakata.",
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
        <p className="text-center text-sm text-muted-foreground">
          ¿No tenés cuenta?{" "}
          <Link href="/signup" className="font-semibold underline underline-offset-2">
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
