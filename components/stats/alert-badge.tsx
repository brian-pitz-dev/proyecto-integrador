import type { ReactNode } from "react";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AlertBadgeProps {
  /** Texto de la fila de aviso (solo se muestra si atRisk es true). */
  label: ReactNode;
  atRisk: boolean;
  /** Texto del Badge "todo bien" cuando atRisk es false. */
  okLabel?: string;
}

/** Fila de aviso para Estadísticas (gym/datos faltantes), con su contraparte "todo bien". Es un recordatorio, no un error: va en ámbar. */
export function AlertBadge({ label, atRisk, okLabel = "Todo en orden" }: AlertBadgeProps) {
  if (!atRisk) {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <CircleCheck className="size-3.5" aria-hidden="true" />
        {okLabel}
      </Badge>
    );
  }
  return (
    <p className="flex items-start gap-2 rounded-md bg-warning/15 px-3 py-2 text-sm text-foreground">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
      <span>{label}</span>
    </p>
  );
}
