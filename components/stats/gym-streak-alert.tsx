import { Dumbbell, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function GymStreakAlert({ atRisk }: { atRisk: boolean }) {
  if (!atRisk) {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <Dumbbell className="size-3.5" aria-hidden="true" />
        Racha de gym al día
      </Badge>
    );
  }
  return (
    <p className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      Perdiste 3 o más sesiones de gym programadas seguidas
    </p>
  );
}
