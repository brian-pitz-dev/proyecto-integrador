import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pantalla de carga de marca para los loading.tsx: logo con anillo girando + qué se está preparando. */
export function LoadingScreen({
  title,
  detail,
  className,
}: {
  title: string;
  detail: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "grid min-h-[60vh] place-items-center animate-in fade-in-0 duration-300",
        className,
      )}
    >
      <div className="grid justify-items-center gap-6 text-center">
        <div className="relative grid size-28 place-items-center">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" aria-hidden="true" />
          <div
            className="absolute inset-0 animate-spin rounded-full border-4 border-primary/15 border-t-primary [animation-duration:1.1s]"
            aria-hidden="true"
          />
          <div className="relative grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Flame className="size-8 animate-pulse" aria-hidden="true" />
          </div>
        </div>
        <div className="grid gap-1.5">
          <p className="font-heading text-2xl font-semibold text-foreground">{title}</p>
          <p className="max-w-xs text-sm text-balance text-muted-foreground">{detail}</p>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="size-2 animate-bounce rounded-full bg-primary/70"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
