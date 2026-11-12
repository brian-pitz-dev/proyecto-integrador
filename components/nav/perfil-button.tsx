"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Acceso a Mi perfil en el header; se resalta como una pestaña cuando estás ahí. */
export function PerfilButton() {
  const active = usePathname().startsWith("/perfil");
  return (
    <Link
      href="/perfil"
      aria-label="Mi perfil"
      title="Mi perfil"
      aria-current={active ? "page" : undefined}
      className={cn(
        buttonVariants({ variant: "outline", size: "icon-sm" }),
        active && "border-primary bg-primary/15 text-primary",
      )}
    >
      <UserRound className="size-4" aria-hidden="true" />
    </Link>
  );
}
