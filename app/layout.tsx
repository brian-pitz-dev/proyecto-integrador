import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sidebar } from "@/components/nav/sidebar";
import { MobileDrawer } from "@/components/nav/mobile-drawer";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Plan de Vida 2026",
  description: "Registro de ejercicio, dieta y calendario de entrenamiento",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`h-full antialiased ${jetBrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="flex min-h-full">
            <Sidebar />

            <div className="flex min-h-full flex-1 flex-col">
              <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background px-4 py-2.5 lg:justify-end">
                <div className="lg:hidden">
                  <MobileDrawer />
                </div>
                <ThemeToggle />
              </header>

              <SiteHeader />

              <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-8">
                {children}
              </main>

              <SiteFooter />
            </div>
          </div>

          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
