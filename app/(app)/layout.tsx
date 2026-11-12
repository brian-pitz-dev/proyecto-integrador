import Link from "next/link";
import { Flame } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavTabs, BottomTabs } from "@/components/nav/nav-tabs";
import { LogoutButton } from "@/components/nav/logout-button";
import { PerfilButton } from "@/components/nav/perfil-button";
import { Tutorial } from "@/components/tutorial";
import { getAuthedUser } from "@/lib/supabase/auth";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getAuthedUser();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b bg-background px-4 py-2.5 lg:px-8">
        <Link
          href="/calendario"
          aria-label="Bakata, ir al calendario"
          className="col-start-1 flex items-center gap-2 justify-self-start rounded-lg font-heading text-lg font-semibold text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30">
            <Flame className="size-4.5" aria-hidden="true" />
          </span>
          Bakata
        </Link>
        <div className="col-start-2 min-w-0 justify-self-center">
          <NavTabs />
        </div>
        <div className="col-start-3 flex items-center justify-self-end gap-2">
          <PerfilButton />
          <Tutorial abrirAlEntrar={!!user && !user.tutorialVisto} nombre={user?.nombre ?? null} />
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-24 lg:px-8 lg:pb-12">
        {children}
      </main>

      <BottomTabs />
    </div>
  );
}
