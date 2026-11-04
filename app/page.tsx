import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Flame, TrendingUp, UtensilsCrossed } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Bakata",
  description: "Registro de ejercicio, dieta y calendario de entrenamiento.",
  alternates: { canonical: "/" },
  robots: { index: false, follow: false },
};

const PILARES = [
  {
    icon: CalendarDays,
    title: "Plan de gimnasio",
    text: "Calendario semanal que rota de fase sola, según tus propios eventos.",
  },
  {
    icon: UtensilsCrossed,
    title: "Nutrición",
    text: "Menú rotativo con objetivo de proteína diario, ajustado a cada fase.",
  },
  {
    icon: TrendingUp,
    title: "Estadísticas",
    text: "Seguimiento de tiradas, ritmo, peso y resultados de tus eventos.",
  },
];

export default function HomePage() {
  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="grid w-full max-w-md gap-10 text-center">
        <div className="grid justify-center gap-3">
          <div className="grid size-14 place-items-center justify-self-center rounded-2xl bg-primary text-primary-foreground">
            <Flame className="size-7" aria-hidden="true" />
          </div>
          <div className="grid gap-1.5">
            <h1 className="font-heading text-5xl font-bold">Bakata</h1>
            <p className="text-sm text-muted-foreground">
              Tu plan de entrenamiento, nutrición y progreso hacia tus propios eventos.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Ingresar
          </Link>
          <Link href="/signup" className={buttonVariants({ size: "lg", variant: "outline" })}>
            Crear cuenta
          </Link>
        </div>

        <ul className="grid gap-4 text-left sm:grid-cols-3 sm:text-center">
          {PILARES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="grid gap-2 sm:justify-center">
              <Icon className="size-5 text-primary sm:mx-auto" aria-hidden="true" />
              <div>
                <p className="font-heading text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
