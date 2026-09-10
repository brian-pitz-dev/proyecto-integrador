import { ThemeToggle } from "@/components/theme-toggle";
import { Sidebar } from "@/components/nav/sidebar";
import { MobileDrawer } from "@/components/nav/mobile-drawer";
import { LogoutButton } from "@/components/nav/logout-button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-full">
      <Sidebar />

      <div className="flex min-h-full flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background px-4 py-2.5 lg:justify-end">
          <div className="lg:hidden">
            <MobileDrawer />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>

        <SiteHeader />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-8">{children}</main>

        <SiteFooter />
      </div>
    </div>
  );
}
