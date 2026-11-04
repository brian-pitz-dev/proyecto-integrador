import type { Metadata } from "next";
import { OnboardingForm } from "@/components/onboarding-form";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Completar registro · Plan de Vida 2026",
  description: "Contanos tu perfil y tus eventos para armar tu plan.",
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="grid w-full gap-4">
        <h1 className="sr-only">Completar registro</h1>
        <OnboardingForm />
      </div>
    </div>
  );
}
