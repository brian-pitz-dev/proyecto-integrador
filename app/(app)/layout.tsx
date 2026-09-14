import { ThemeToggle } from "@/components/theme-toggle";
import { MobileDrawer } from "@/components/nav/mobile-drawer";
import { NavTabs } from "@/components/nav/nav-tabs";
import { LogoutButton } from "@/components/nav/logout-button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b bg-background px-4 py-2.5 lg:px-8">
        <div className="col-start-1 lg:hidden">
          <MobileDrawer />
        </div>
        <div className="col-start-2 min-w-0 justify-self-center">
          <NavTabs />
        </div>
        <div className="col-start-3 flex items-center justify-self-end gap-2">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-8">{children}</main>

      <SiteFooter />
    </div>
  );
}
