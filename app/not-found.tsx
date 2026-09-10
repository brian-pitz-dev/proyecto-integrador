import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div className="grid gap-3">
        <Compass className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-2xl font-semibold">Página no encontrada</h1>
        <p className="text-sm text-muted-foreground">Esta sección no existe o se movió.</p>
        <Button render={<Link href="/calendario" />} nativeButton={false}>
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
