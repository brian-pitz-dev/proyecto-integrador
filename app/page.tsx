import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Plan de Vida 2026",
  description: "Registro de ejercicio, dieta y calendario de entrenamiento.",
  alternates: { canonical: "/" },
  robots: { index: false, follow: false },
};

export default function HomePage() {
  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="grid max-w-md gap-6 text-center">
        <div className="grid gap-1.5">
          <h1 className="text-5xl font-bold">Plan de Vida 2026</h1>
          <p className="text-sm text-muted-foreground">
            Tu plan de entrenamiento, nutrición y progreso hacia tus propios eventos.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Ingresar
          </Link>
          <Link href="/signup" className={buttonVariants({ size: "lg", variant: "outline" })}>
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
