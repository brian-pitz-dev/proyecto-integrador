import { CalendarDays, UtensilsCrossed, ChartColumn, Sparkles } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/calendario", label: "Calendario", Icon: CalendarDays },
  { href: "/nutricion", label: "Nutrición", Icon: UtensilsCrossed },
  { href: "/estadisticas", label: "Estadísticas", Icon: ChartColumn },
  { href: "/coach", label: "Coach", Icon: Sparkles },
] as const;
