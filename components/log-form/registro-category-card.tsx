"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteLogButton } from "@/components/log-form/delete-log-button";
import { saveLog } from "@/app/registro/actions";

const CloseDialogContext = createContext<() => void>(() => {});

/** Guardado de los formularios de un RegistroCategoryCard: evita el doble submit, avisa con toast y cierra el modal si sale bien. */
export function useLogSubmit(successMessage: string) {
  const closeDialog = useContext(CloseDialogContext);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function submit(input: Parameters<typeof saveLog>[0]): Promise<boolean> {
    if (pendingRef.current) return false;
    pendingRef.current = true;
    setPending(true);
    const result = await saveLog(input);
    pendingRef.current = false;
    setPending(false);

    if (!result.ok) {
      toast.error(result.message ?? "No se pudo guardar.");
      return false;
    }
    toast.success(successMessage);
    formRef.current?.reset();
    closeDialog();
    return true;
  }

  return { pending, formRef, submit };
}

export interface RegistroEntry {
  id: string;
  label: string;
  date: string;
}

/** Botón que abre el modal de carga; los formularios adentro lo cierran con useLogSubmit al guardar. */
export function LogDialog({
  title,
  buttonLabel,
  children,
}: {
  title: string;
  buttonLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>+ {buttonLabel}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <CloseDialogContext.Provider value={() => setOpen(false)}>
          {children}
        </CloseDialogContext.Provider>
      </DialogContent>
    </Dialog>
  );
}

interface RegistroCategoryCardProps {
  icon: ReactNode;
  title: string;
  entries: RegistroEntry[];
  buttonLabel: string;
  children: ReactNode;
  className?: string;
}

/** Card por categoría (Stats): botón de carga arriba + últimos 5 registros. */
export function RegistroCategoryCard({
  icon,
  title,
  entries,
  buttonLabel,
  children,
  className,
}: RegistroCategoryCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex items-center justify-between gap-2 border-b">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          {icon}
          {title}
        </CardTitle>
        <LogDialog title={title} buttonLabel={buttonLabel}>
          {children}
        </LogDialog>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no cargaste nada acá.</p>
        ) : (
          <ul className="-my-1 divide-y divide-border">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 py-1 text-sm">
                <span className="min-w-0 flex-1 break-words tabular-nums">{entry.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{entry.date}</span>
                <DeleteLogButton id={entry.id} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
