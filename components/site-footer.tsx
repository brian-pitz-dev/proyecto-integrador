"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { EVENT_CARDS, RULE_CARDS, type RuleCard } from "@/lib/plan-content";

const TONE_CLASSES: Record<RuleCard["tone"], string> = {
  green: "border-primary/40",
  orange: "border-destructive/40",
  purple: "border-accent/50",
  pink: "border-ring/40",
};

type Tab = "eventos" | "reglas" | null;

export function SiteFooter() {
  const [tab, setTab] = useState<Tab>(null);

  return (
    <footer className="border-t">
      <div className="flex w-full">
        {(["eventos", "reglas"] as const).map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab((cur) => (cur === t ? null : t))}
            className={cn(
              "flex-1 py-3 text-center text-sm font-medium capitalize transition-colors",
              i > 0 && "border-l border-border",
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "eventos" && (
        <div className="mx-auto grid w-full max-w-6xl gap-3 border-t px-4 py-4 sm:grid-cols-3 lg:px-8">
          {EVENT_CARDS.map((event) => (
            <div key={event.title} className="rounded-lg border border-border p-3">
              <h3 className="text-sm font-semibold text-foreground">{event.title}</h3>
              <p className="mb-2 text-xs text-muted-foreground">{event.dateLabel}</p>
              <div className="grid gap-1.5">
                {event.paragraphs.map((p) => (
                  <p key={p.label} className="text-xs text-muted-foreground">
                    <strong className="text-foreground">{p.label}:</strong> {p.text}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "reglas" && (
        <div className="mx-auto grid w-full max-w-6xl gap-3 border-t px-4 py-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {RULE_CARDS.map((card) => (
            <div key={card.title} className={cn("rounded-lg border p-3", TONE_CLASSES[card.tone])}>
              <h3 className="mb-1.5 text-sm font-semibold text-foreground">{card.title}</h3>
              <ul className="grid list-disc gap-1 pl-4 text-xs text-muted-foreground">
                {card.rules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <p className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Plan de Vida 2026
      </p>
    </footer>
  );
}
