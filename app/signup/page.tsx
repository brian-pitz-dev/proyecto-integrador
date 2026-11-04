import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/signup-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "Crear cuenta · Bakata",
  description: "Registrate para armar tu propio plan de entrenamiento y nutrición.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <div className="relative grid min-h-dvh place-items-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="grid w-full max-w-sm gap-6 px-4">
        <h1 className="sr-only">Crear cuenta</h1>
        <BrandMark />
        <SignupForm />
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-semibold underline underline-offset-2">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
