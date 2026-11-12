"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteLog } from "@/app/registro/actions";

export function DeleteLogButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleConfirmDelete() {
    setPending(true);
    // sin el catch, un error de red dejaba el botón girando para siempre
    const result = await deleteLog(id).catch(() => ({
      ok: false,
      message: "No se pudo conectar, probá de nuevo.",
    }));
    setPending(false);
    setOpen(false);

    if (result.ok) {
      toast.success("Borrado");
    } else {
      toast.error(result.message ?? "No se pudo borrar el registro.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o || !pending) && setOpen(o)}>
      <Button
        variant="ghost"
        size="icon-lg"
        className="shrink-0 text-muted-foreground hover:text-destructive"
        aria-label="Borrar registro"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Borrar este registro?</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={
              <Button variant="outline" disabled={pending}>
                Cancelar
              </Button>
            }
          />
          <Button variant="destructive" loading={pending} onClick={handleConfirmDelete}>
            Borrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
