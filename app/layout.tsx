import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
});

const isProduction = process.env.CONTEXT === "production";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Bakata",
  description: "Registro de ejercicio, dieta y calendario de entrenamiento",
  openGraph: {
    title: "Bakata",
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
      className={`h-full antialiased ${barlow.variable} ${barlowCondensed.variable}`}
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
