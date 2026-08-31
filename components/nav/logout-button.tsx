"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/login/actions";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label="Cerrar sesión"
      disabled={pending}
      onClick={handleLogout}
    >
      <LogOut className="size-4" aria-hidden="true" />
    </Button>
  );
}
