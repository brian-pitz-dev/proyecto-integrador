import type { Metadata } from "next";
import { getUserPlanContext } from "@/lib/user-plan";
import { getAuthedUser } from "@/lib/supabase/auth";
import { PerfilClient } from "@/components/perfil/perfil-client";

export const metadata: Metadata = {
  title: "Mi perfil · Bakata",
  description: "Tus datos, tus días de entrenamiento y tus eventos.",
  alternates: { canonical: "/perfil" },
};

export default async function PerfilPage() {
  const [ctx, user] = await Promise.all([getUserPlanContext(), getAuthedUser()]);
  if (!ctx || !user) return null; // proxy.ts ya redirige a /login u /onboarding antes de esto

  return (
    <PerfilClient
      nombre={user.nombre ?? ""}
      email={user.email ?? ""}
      perfil={ctx.profile}
      events={ctx.events}
    />
  );
}
