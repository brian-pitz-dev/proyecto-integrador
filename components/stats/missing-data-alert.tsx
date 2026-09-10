import { ClipboardList, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function MissingDataAlert({ items }: { items: string[] }) {
  if (items.length === 0) {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <ClipboardList className="size-3.5" aria-hidden="true" />
        Registro del día al día
      </Badge>
    );
  }
  return (
    <p className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      Todavía no cargaste hoy: {items.join(", ")}
    </p>
  );
}
