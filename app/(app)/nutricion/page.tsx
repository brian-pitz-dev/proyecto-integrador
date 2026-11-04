import type { Metadata } from "next";
import { getUserPlanContext } from "@/lib/user-plan";
import { NutricionClient } from "@/components/nutrition/nutricion-client";

export const metadata: Metadata = {
  title: "Nutrición · Bakata",
  description:
    "Plan de comidas del día: desayuno, almuerzo, merienda y cena, con rotación semanal.",
  alternates: { canonical: "/nutricion" },
};

export default async function NutricionPage() {
  const planContext = await getUserPlanContext();
  if (!planContext) return null; // proxy.ts ya redirige a /onboarding antes de esto
  return <NutricionClient weeks={planContext.weeks} />;
}
