import type { Metadata } from "next";
import Link from "next/link";
import { RecuperarForm } from "@/components/recuperar-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "Recuperar contraseña · Bakata",
  description: "Elegí una contraseña nueva para tu cuenta de Bakata.",
  robots: { index: false, follow: false },
};

export default async function RecuperarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="relative grid min-h-dvh place-items-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="grid w-full max-w-sm gap-6 px-4">
        <h1 className="sr-only">Recuperar contraseña</h1>
        <BrandMark />
        {error === "link" && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
          >
            El link venció, ya se usó o se abrió en otro navegador. Pedí uno nuevo.
          </p>
        )}
        <RecuperarForm />
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold underline underline-offset-2">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
