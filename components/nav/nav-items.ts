import { CalendarDays, UtensilsCrossed, ChartColumn, Dumbbell } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/calendario", label: "Calendario", Icon: CalendarDays },
  { href: "/nutricion", label: "Nutrición", Icon: UtensilsCrossed },
  { href: "/estadisticas", label: "Estadísticas", Icon: ChartColumn },
  { href: "/mancuernas", label: "Mancuernas", Icon: Dumbbell },
] as const;
