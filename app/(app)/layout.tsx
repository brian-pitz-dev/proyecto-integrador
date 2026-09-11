import { ThemeToggle } from "@/components/theme-toggle";
import { NavTabs } from "@/components/nav/nav-tabs";
import { LogoutButton } from "@/components/nav/logout-button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b bg-background px-4 py-2.5 lg:px-8">
        <NavTabs />
        <div className="flex shrink-0 items-center gap-2">
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
