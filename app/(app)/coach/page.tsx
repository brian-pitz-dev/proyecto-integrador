import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUserPlanContext } from "@/lib/user-plan";
import { addDays, fromISO, toISO, todayNormalized } from "@/lib/date";
import { resumenSemanal } from "@/lib/stats-summary";
import type { Registro } from "@/lib/types";
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
  const hoy = todayNormalized();
  const [
    { data: uso },
    { data: perfil },
    { data: ultimoEvento },
    { data: registros },
    { data: ultimoPeso },
  ] = await Promise.all([
    supabase.from("uso_ia").select("usos").eq("fecha", toISO(todayNormalized())).maybeSingle(),
    supabase.from("perfil").select("updated_at").maybeSingle(),
    supabase
      .from("evento")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // dos semanas: cubre desde el lunes y el peso de hace 7 días
    supabase
      .from("registro")
      .select("*")
      .gte("fecha", toISO(addDays(hoy, -14)))
      .order("fecha", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("registro")
      .select("valor")
      .eq("categoria", "peso")
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // shortcut: borrar un evento no deja rastro y no marca el plan de la IA como viejo;
  // si hace falta, guardar la fecha del último cambio en perfil y comparar contra eso.
  const lastChange = [perfil?.updated_at, ultimoEvento?.updated_at]
    .filter((d): d is string => !!d)
    .sort()
    .at(-1);
  const isStale = (updatedAt?: string) => !!updatedAt && !!lastChange && updatedAt < lastChange;
  const { planIa, profile, events, weeks } = planContext;
  const regs = (registros as Registro[] | null) ?? [];
  const resumen = resumenSemanal({
    weeks,
    events,
    planStart: fromISO(profile.planStart),
    completedDates: new Set(regs.filter((r) => r.categoria === "completado").map((r) => r.fecha)),
    registros: regs,
    pesoActual: ultimoPeso ? Number(ultimoPeso.valor) : null,
    metaPesoKg: profile.metaPesoKg ?? null,
    hoy,
  });

  return (
    <CoachClient
      resumen={resumen}
      usosHoy={uso?.usos ?? 0}
      limite={AI_DAILY_LIMIT}
      tieneComidas={!!planIa.comidas}
      tieneRutinas={!!planIa.ejercicios}
      comidasDesactualizadas={isStale(planIa.comidasUpdatedAt)}
      rutinasDesactualizadas={isStale(planIa.ejerciciosUpdatedAt)}
    />
  );
}
