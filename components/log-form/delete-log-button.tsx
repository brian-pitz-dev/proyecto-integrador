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

export function DeleteLogButton({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleConfirmDelete() {
    setPending(true);
    const result = await deleteLog(id);
    setPending(false);
    setOpen(false);

    if (result.ok) {
      toast.success("Borrado");
    } else {
      toast.error(result.message ?? "No se pudo borrar el registro.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="icon-sm"
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
          <DialogClose render={<Button variant="outline">Cancelar</Button>} />
          <Button variant="destructive" disabled={pending} onClick={handleConfirmDelete}>
            Borrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
