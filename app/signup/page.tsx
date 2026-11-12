import type { Metadata } from "next";
import Link from "next/link";
import { RegistroWizard } from "@/components/registro/registro-wizard";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "Crear cuenta · Bakata",
  description: "Registrate para armar tu propio plan de entrenamiento y nutrición.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <div className="relative grid min-h-dvh place-items-center py-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="grid w-full max-w-3xl gap-4 px-4">
        <h1 className="sr-only">Crear cuenta</h1>
        <BrandMark />
        <RegistroWizard mode="signup" />
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
