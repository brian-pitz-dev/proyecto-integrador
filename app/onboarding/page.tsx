import type { Metadata } from "next";
import { RegistroWizard } from "@/components/registro/registro-wizard";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "Completar registro · Bakata",
  description: "Contanos tu perfil y tus eventos para armar tu plan.",
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="grid w-full max-w-3xl gap-4">
        <h1 className="sr-only">Completar registro</h1>
        <BrandMark />
        <RegistroWizard mode="onboarding" />
      </div>
    </div>
  );
}
