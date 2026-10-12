import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { getNextEvent } from "@/lib/training-plan";
import { todayNormalized, formatShort } from "@/lib/date";

export const metadata: Metadata = {
  title: "Plan de Vida 2026",
  description: "Registro de ejercicio, dieta y calendario de entrenamiento.",
  alternates: { canonical: "/" },
  robots: { index: false, follow: false },
};

export default async function HomePage() {
  // la cuenta regresiva cambia cada día: se calcula en cada request, no en el build
  await connection();
  const today = todayNormalized();
  const nextEvent = getNextEvent(today);
  const daysLeft = nextEvent
    ? Math.ceil((nextEvent.date.getTime() - today.getTime()) / 86_400_000)
    : null;

  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="grid max-w-md gap-6 text-center">
        <div className="grid gap-1.5">
          <h1 className="text-5xl font-bold">Plan de Vida 2026</h1>
          <p className="text-sm text-muted-foreground">
            Registro de ejercicio, dieta y calendario de entrenamiento.
          </p>
        </div>

        <div className="rounded-xl border-l-4 border-run bg-card px-6 py-5 text-left ring-1 ring-foreground/10">
          {nextEvent && daysLeft !== null ? (
            <>
              <p className="text-sm text-muted-foreground">Próximo evento</p>
              <p className="font-heading text-3xl font-bold">{nextEvent.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatShort(nextEvent.date)},{" "}
                {daysLeft === 0 ? "¡Es hoy!" : `en ${daysLeft} día${daysLeft === 1 ? "" : "s"}`}
              </p>
            </>
          ) : (
            <p className="text-sm font-medium text-foreground">
              Los 3 eventos del plan ya pasaron — plan completado.
            </p>
          )}
        </div>

        <Link href="/login" className={buttonVariants({ size: "lg" })}>
          Ingresar
        </Link>
      </div>
    </div>
  );
}
