import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { getNextEvent } from "@/lib/training-plan";
import { todayNormalized, formatShort } from "@/lib/date";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Plan de Vida 2026",
  description: "Registro de ejercicio, dieta y calendario de entrenamiento.",
  alternates: { canonical: "/" },
  robots: { index: false, follow: false },
};

export default function HomePage() {
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
          <h1 className="text-3xl font-bold text-foreground">Plan de Vida 2026</h1>
          <p className="text-sm text-muted-foreground">
            Registro de ejercicio, dieta y calendario de entrenamiento.
          </p>
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary/5 px-6 py-5">
          {nextEvent && daysLeft !== null ? (
            <>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Próximo evento
              </p>
              <p className="mt-1 text-2xl font-bold text-primary">{nextEvent.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatShort(nextEvent.date)} ·{" "}
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
