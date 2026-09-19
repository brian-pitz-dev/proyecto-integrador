import { Dumbbell, UtensilsCrossed, ChartColumn, Zap } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/calendario", label: "Plan de gimnasio", Icon: Dumbbell },
  { href: "/mancuernas", label: "Mancuernas", Icon: Zap },
  { href: "/nutricion", label: "Nutrición", Icon: UtensilsCrossed },
  { href: "/estadisticas", label: "Stats", Icon: ChartColumn },
] as const;
