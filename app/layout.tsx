import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-sans",
});

const isProduction = process.env.CONTEXT === "production";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Plan de Vida 2026",
  description: "Registro de ejercicio, dieta y calendario de entrenamiento",
  openGraph: {
    title: "Plan de Vida 2026",
    description: "Registro de ejercicio, dieta y calendario de entrenamiento",
    type: "website",
  },
  // Per-page overrides (e.g. app/login) can still opt out individually;
  // this is the site-wide default driven by the Netlify build context —
  // see research.md Decision 9.
  robots: isProduction ? { index: true, follow: true } : { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`h-full antialiased ${jetBrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
