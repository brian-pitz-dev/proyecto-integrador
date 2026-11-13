"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { borrarFoto, subirFoto } from "@/app/(app)/estadisticas/actions";
import { formatShort, fromISO } from "@/lib/date";
import type { Foto } from "@/lib/fotos";

const LADO_MAX = 1600;

/**
 * Achica la foto a LADO_MAX px y la pasa a JPEG: pesa 200-600 KB en vez de 3-8 MB (entra en el
 * límite de las Server Actions) y pierde el EXIF, que en un celular trae la ubicación GPS.
 */
async function achicar(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const escala = Math.min(1, LADO_MAX / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * escala);
  canvas.height = Math.round(bmp.height * escala);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", 0.85),
  );
}

export function FotosProgreso({ fotos, hoy }: { fotos: Foto[]; hoy: string }) {
  const [subiendo, setSubiendo] = useState(false);
  const [aBorrar, setABorrar] = useState<string | null>(null);
  const [borrando, setBorrando] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function subir(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const datos = new FormData(event.currentTarget);
    const original = datos.get("foto");
    if (!(original instanceof File) || !original.size) return toast.error("Elegí una foto.");

    setSubiendo(true);
    try {
      datos.set("foto", await achicar(original), "foto.jpg");
    } catch {
      setSubiendo(false);
      // ej. HEIC en un navegador que no lo abre
      return toast.error("No pudimos abrir esa imagen. Probá con una JPG o PNG.");
    }
    const result = await subirFoto(datos).catch(() => ({
      ok: false,
      message: "No se pudo conectar, probá de nuevo.",
    }));
    setSubiendo(false);
    if (result.ok) {
      toast.success(result.message ?? "Foto guardada.");
      formRef.current?.reset();
    } else toast.error(result.message ?? "No se pudo subir la foto.");
  }

  async function confirmarBorrado() {
    if (!aBorrar) return;
    setBorrando(true);
    const result = await borrarFoto(aBorrar).catch(() => ({
      ok: false,
      message: "No se pudo conectar, probá de nuevo.",
    }));
    setBorrando(false);
    setABorrar(null);
    if (result.ok) toast.success(result.message ?? "Foto borrada.");
    else toast.error(result.message ?? "No se pudo borrar la foto.");
  }

  return (
    <div className="grid gap-5">
      <form
        ref={formRef}
        onSubmit={subir}
        className="grid items-end gap-3 sm:grid-cols-[1fr_auto_auto]"
      >
        <div className="grid gap-1.5">
          <Label htmlFor="foto-archivo">Foto</Label>
          <Input id="foto-archivo" name="foto" type="file" accept="image/*" required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="foto-fecha">Fecha</Label>
          <Input id="foto-fecha" name="fecha" type="date" defaultValue={hoy} max={hoy} required />
        </div>
        <Button type="submit" loading={subiendo}>
          <ImagePlus aria-hidden="true" /> {subiendo ? "Subiendo…" : "Subir"}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        Una por día: si subís otra con la misma fecha, reemplaza a la anterior. Solo vos podés
        verlas, y antes de subirlas les borramos la ubicación.
      </p>

      {fotos.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {fotos.map((f) => {
            const fecha = formatShort(fromISO(f.fecha));
            return (
              <li key={f.fecha} className="grid gap-1.5">
                <a href={f.url} target="_blank" rel="noopener noreferrer">
                  {/* <img> y no next/image: las URLs firmadas vencen en 1 h y no hay que optimizarlas */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.url}
                    alt={`Foto de progreso del ${fecha}`}
                    loading="lazy"
                    className="aspect-[3/4] w-full rounded-lg bg-muted object-cover"
                  />
                </a>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm tabular-nums">{fecha}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Borrar la foto del ${fecha}`}
                    onClick={() => setABorrar(f.fecha)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Todavía no subiste fotos. Sacate una cada semana o dos, con la misma luz y la misma pose,
          para ver los cambios que la balanza no muestra.
        </p>
      )}

      <Dialog open={aBorrar !== null} onOpenChange={(o) => !o && !borrando && setABorrar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              ¿Borrar la foto del {aBorrar ? formatShort(fromISO(aBorrar)) : ""}?
            </DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" disabled={borrando}>
                  Cancelar
                </Button>
              }
            />
            <Button variant="destructive" loading={borrando} onClick={confirmarBorrado}>
              Borrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
