import { Flame } from "lucide-react";

/** Marca de Bakata para las páginas públicas (login/signup/onboarding) — el h1 de cada página queda sr-only, esto es lo que se ve. */
export function BrandMark() {
  return (
    <div className="grid justify-center gap-1.5 text-center">
      <div className="grid size-11 place-items-center justify-self-center rounded-xl bg-primary text-primary-foreground">
        <Flame className="size-5" aria-hidden="true" />
      </div>
      <p className="font-heading text-lg font-semibold">Bakata</p>
    </div>
  );
}
