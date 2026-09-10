import type { Metadata } from "next";
import { CalendarGrid } from "@/components/calendar-grid/calendar-grid";
import { createClient } from "@/lib/supabase/server";
import { getWeeks } from "@/lib/training-plan";

export const metadata: Metadata = {
  title: "Calendario · Plan de Vida 2026",
  description: "Plan de gimnasio semana a semana: sesiones, fases de entrenamiento y eventos.",
  alternates: { canonical: "/calendario" },
};

/** Equivalente a getCompletedDates() de plan_vida_2026.html. */
async function fetchCompletedDates(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("registro").select("fecha").eq("categoria", "completado");
  return (data ?? []).map((r) => r.fecha as string);
}

export default async function CalendarioPage() {
  const completedDates = await fetchCompletedDates();

  return (
    <div className="grid gap-5">
      <h1 className="mx-auto w-full max-w-4xl text-3xl font-bold text-foreground">Calendario</h1>
      <CalendarGrid completedDates={completedDates} weeks={getWeeks()} />
    </div>
  );
}
