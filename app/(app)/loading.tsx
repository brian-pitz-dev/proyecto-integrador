import { LoaderCircle } from "lucide-react";

/** Fallback de toda pestaña sin loading.tsx propio (nutrición, coach): aparece al instante al navegar. */
export default function Loading() {
  return (
    <div role="status" className="grid gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        Cargando…
      </div>
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-lg border border-border bg-muted/60" />
        <div className="h-40 animate-pulse rounded-lg border border-border bg-muted/60" />
      </div>
    </div>
  );
}
