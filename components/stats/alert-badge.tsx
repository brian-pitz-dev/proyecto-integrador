import { CircleCheck, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AlertBadgeProps {
  /** Texto de la fila de riesgo (solo se muestra si atRisk es true). */
  label: string;
  atRisk: boolean;
  /** Texto del Badge "todo bien" cuando atRisk es false. */
  okLabel?: string;
}

/** Fila de riesgo para Estadísticas (gym/pace/datos faltantes), con su contraparte "todo bien". */
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
    <p className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {label}
    </p>
  );
}
