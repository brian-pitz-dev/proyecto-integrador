import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavTabs, BottomTabs } from "@/components/nav/nav-tabs";
import { LogoutButton } from "@/components/nav/logout-button";
import { Tutorial } from "@/components/tutorial";
import { getAuthedUser } from "@/lib/supabase/auth";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getAuthedUser();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b bg-background px-4 py-2.5 lg:px-8">
        <Link
          href="/calendario"
          className="col-start-1 font-heading text-lg font-semibold text-foreground lg:hidden"
        >
          Bakata
        </Link>
        <div className="col-start-2 min-w-0 justify-self-center">
          <NavTabs />
        </div>
        <div className="col-start-3 flex items-center justify-self-end gap-2">
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
