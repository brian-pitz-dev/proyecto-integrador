"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteLogButton } from "@/components/log-form/delete-log-button";

const CloseDialogContext = createContext<() => void>(() => {});

/** Los formularios dentro de un RegistroCategoryCard lo usan para cerrar el modal al guardar con éxito. */
export function useCloseLogEntryDialog() {
  return useContext(CloseDialogContext);
}

export interface RegistroEntry {
  id: number;
  label: string;
  date: string;
}

interface RegistroCategoryCardProps {
  icon: ReactNode;
  title: string;
  entries: RegistroEntry[];
  buttonLabel: string;
  children: ReactNode;
}

/** Card por categoría (Stats): últimos 5 registros + botón para abrir el modal de carga. */
export function RegistroCategoryCard({
  icon,
  title,
  entries,
  buttonLabel,
  children,
}: RegistroCategoryCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin registros aún</p>
        ) : (
          <ul className="-my-1 divide-y divide-border">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                <span className="shrink-0 text-muted-foreground">{entry.date}</span>
                <DeleteLogButton id={entry.id} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant="outline" size="sm" className="w-full" />}>
            + {buttonLabel}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <CloseDialogContext.Provider value={() => setOpen(false)}>
              {children}
            </CloseDialogContext.Provider>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
