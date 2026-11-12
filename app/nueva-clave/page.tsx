import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthedUser } from "@/lib/supabase/auth";
import { NuevaClaveForm } from "@/components/nueva-clave-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "Contraseña nueva · Bakata",
  description: "Elegí una contraseña nueva para tu cuenta de Bakata.",
  robots: { index: false, follow: false },
};

/** Destino del link de recuperación: /auth/confirm ya dejó la sesión iniciada. */
export default async function NuevaClavePage() {
  const user = await getAuthedUser();
  if (!user) redirect("/recuperar?error=link");

  return (
    <div className="relative grid min-h-dvh place-items-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="grid w-full max-w-sm gap-6 px-4">
        <h1 className="sr-only">Contraseña nueva</h1>
        <BrandMark />
        <NuevaClaveForm email={user.email ?? ""} />
      </div>
    </div>
  );
}
