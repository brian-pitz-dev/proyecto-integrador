import type { Metadata } from "next";
import { getWeeks } from "@/lib/training-plan";
import { NutricionClient } from "@/components/nutrition/nutricion-client";

export const metadata: Metadata = {
  title: "Nutrición · Plan de Vida 2026",
  description:
    "Plan de comidas del día: desayuno, almuerzo, merienda y cena, con rotación semanal.",
  alternates: { canonical: "/nutricion" },
};

export default function NutricionPage() {
  return <NutricionClient weeks={getWeeks()} />;
}
