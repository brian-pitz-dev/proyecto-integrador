"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/login/actions";

export function LogoutButton() {
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await logout(); // redirige a /login desde el server
  }

  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label="Cerrar sesión"
      loading={pending}
      onClick={handleLogout}
    >
      <LogOut className="size-4" aria-hidden="true" />
    </Button>
  );
}
