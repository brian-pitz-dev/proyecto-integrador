import { FIXED_RULES } from "@/lib/meal-plan";

export function FixedRules() {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
      <p className="mb-1.5 font-medium text-foreground">Reglas fijas</p>
      <ul className="grid gap-1 list-disc pl-4">
        {FIXED_RULES.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    </div>
  );
}
