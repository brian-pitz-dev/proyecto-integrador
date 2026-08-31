import { Footprints, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function RunPaceAlert({ atRisk }: { atRisk: boolean }) {
  if (!atRisk) {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <Footprints className="size-3.5" aria-hidden="true" />
        Ritmo de running al día
      </Badge>
    );
  }
  return (
    <p className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      Tu ritmo de las últimas 2 tiradas de sábado no mejoró
    </p>
  );
}
