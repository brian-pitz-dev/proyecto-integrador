import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUserPlanContext } from "@/lib/user-plan";
import { toISO, todayNormalized } from "@/lib/date";
import { AI_DAILY_LIMIT } from "@/lib/coach";
import { CoachClient } from "@/components/coach/coach-client";

export const metadata: Metadata = {
  title: "Coach · Bakata",
  description: "Coach con IA: consultas sobre tu plan y planes de comidas y gym a tu medida.",
  alternates: { canonical: "/coach" },
};

export default async function CoachPage() {
  const planContext = await getUserPlanContext();
  if (!planContext) return null; // proxy.ts ya redirige a /onboarding antes de esto

  const supabase = await createClient();
  const [{ data: uso }, { data: perfil }, { data: ultimoEvento }] = await Promise.all([
    supabase.from("uso_ia").select("usos").eq("fecha", toISO(todayNormalized())).maybeSingle(),
    supabase.from("perfil").select("created_at").maybeSingle(),
    supabase
      .from("evento")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // shortcut: solo compara contra created_at (hoy no hay edición de perfil/eventos);
  // cuando exista (US5), sumar updated_at a perfil/evento y comparar contra eso.
  const lastChange = [perfil?.created_at, ultimoEvento?.created_at]
    .filter((d): d is string => !!d)
    .sort()
    .at(-1);
  const isStale = (updatedAt?: string) => !!updatedAt && !!lastChange && updatedAt < lastChange;
  const { planIa } = planContext;

  return (
    <CoachClient
      usosHoy={uso?.usos ?? 0}
      limite={AI_DAILY_LIMIT}
      tieneComidas={!!planIa.comidas}
      tieneRutinas={!!planIa.ejercicios}
      comidasDesactualizadas={isStale(planIa.comidasUpdatedAt)}
      rutinasDesactualizadas={isStale(planIa.ejerciciosUpdatedAt)}
    />
  );
}
