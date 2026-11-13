"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Columns2, ImagePlus, Pencil, RotateCcw, RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Opciones } from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { borrarFoto, guardarDatosFoto, subirFoto } from "@/app/(app)/estadisticas/actions";
import { formatShort, fromISO } from "@/lib/date";
import { NOTA_MAX, type Foto } from "@/lib/fotos";

const LADO_MAX = 1600;
const LADO_PREVIA = 320;

/**
 * Dibuja la foto en `canvas` rotada `rot` grados (múltiplo de 90), achicada para que su lado mayor
 * no pase de `lado` px.
 */
function dibujar(canvas: HTMLCanvasElement, bmp: ImageBitmap, rot: number, lado: number) {
  const escala = Math.min(1, lado / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * escala);
  const h = Math.round(bmp.height * escala);
  // de costado (90° o 270°) el ancho y el alto se intercambian
  [canvas.width, canvas.height] = rot % 180 ? [h, w] : [w, h];
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.drawImage(bmp, -w / 2, -h / 2, w, h);
}

/**
 * Rota la foto, la achica a LADO_MAX px y la pasa a JPEG: pesa 200-600 KB en vez de 3-8 MB (entra en el
 * límite de las Server Actions) y pierde el EXIF, que en un celular trae la ubicación GPS.
 */
function exportar(bmp: ImageBitmap, rot: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  dibujar(canvas, bmp, rot, LADO_MAX);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", 0.85),
  );
}

const fechaCorta = (fecha: string) => formatShort(fromISO(fecha));

/** "68 kg · 22 % grasa", o "" si la foto no tiene ninguno. */
const medidasDe = (f: Foto) =>
  [f.peso !== null && `${f.peso} kg`, f.grasa !== null && `${f.grasa} % grasa`]
    .filter(Boolean)
    .join(" · ");

/** "+1.5" / "−2.0": diferencia con signo y un decimal. */
const conSigno = (d: number) => `${d > 0 ? "+" : d < 0 ? "−" : ""}${Math.abs(d).toFixed(1)}`;

const CAMPOS = ["nota", "peso", "grasa"] as const;
type Edicion = Record<(typeof CAMPOS)[number], string>;
// mientras el popup se cierra (editando ya es null) los campos siguen controlados
const SIN_DATOS: Edicion = { nota: "", peso: "", grasa: "" };
const edicionDe = (f: Foto): Edicion => ({
  nota: f.nota ?? "",
  peso: f.peso?.toString() ?? "",
  grasa: f.grasa?.toString() ?? "",
});

export function FotosProgreso({ fotos, hoy }: { fotos: Foto[]; hoy: string }) {
  const [subiendo, setSubiendo] = useState(false);
  const [bmp, setBmp] = useState<ImageBitmap | null>(null);
  const [rot, setRot] = useState(0);
  const [aBorrar, setABorrar] = useState<string | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [editando, setEditando] = useState<{ foto: Foto; valores: Edicion } | null>(null);
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [par, setPar] = useState<[string, string] | null>(null);
  const archivoRef = useRef<HTMLInputElement>(null);
  // estado y no ref: el canvas aparece recién cuando se abre el popup, y ahí hay que dibujar
  const [lienzo, setLienzo] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (bmp && lienzo) dibujar(lienzo, bmp, rot, LADO_PREVIA);
  }, [bmp, lienzo, rot]);

  /** Cierra el popup de subida; vacía el input para poder volver a elegir el mismo archivo. */
  function cerrarSubida() {
    bmp?.close();
    setBmp(null);
    if (archivoRef.current) archivoRef.current.value = "";
  }

  async function elegir(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setRot(0);
    try {
      setBmp(await createImageBitmap(file, { imageOrientation: "from-image" }));
    } catch {
      // ej. HEIC en un navegador que no lo abre
      event.target.value = "";
      toast.error("No pudimos abrir esa imagen. Probá con una JPG o PNG.");
    }
  }

  async function subir(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bmp) return toast.error("Elegí una foto.");
    const datos = new FormData(event.currentTarget);

    setSubiendo(true);
    try {
      datos.set("foto", await exportar(bmp, rot), "foto.jpg");
    } catch {
      setSubiendo(false);
      return toast.error("No pudimos procesar esa imagen. Probá con otra.");
    }
    const result = await subirFoto(datos).catch(() => ({
      ok: false,
      message: "No se pudo conectar, probá de nuevo.",
    }));
    setSubiendo(false);
    if (result.ok) {
      toast.success(result.message ?? "Foto guardada.");
      cerrarSubida();
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

  const editar = (campo: keyof Edicion, valor: string) =>
    setEditando((ed) => ed && { ...ed, valores: { ...ed.valores, [campo]: valor } });

  async function guardarDatos(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editando) return;
    // solo lo que cambió: reescribir un peso igual lo borraría y volvería a cargar
    const antes = edicionDe(editando.foto);
    const cambios = Object.fromEntries(
      CAMPOS.filter((c) => editando.valores[c].trim() !== antes[c]).map((c) => [
        c,
        editando.valores[c],
      ]),
    );
    if (!Object.keys(cambios).length) return setEditando(null);
    setGuardandoDatos(true);
    const result = await guardarDatosFoto(editando.foto.fecha, cambios).catch(() => ({
      ok: false,
      message: "No se pudo conectar, probá de nuevo.",
    }));
    setGuardandoDatos(false);
    if (result.ok) {
      setEditando(null);
      toast.success(result.message ?? "Datos guardados.");
    } else toast.error(result.message ?? "No se pudieron guardar los datos.");
  }

  const items = fotos.map((f) => ({ value: f.fecha, label: fechaCorta(f.fecha) }));
  const comparadas = par?.map((fecha) => fotos.find((f) => f.fecha === fecha));
  const diasEntre = par
    ? Math.round(Math.abs(fromISO(par[1]).getTime() - fromISO(par[0]).getTime()) / 864e5)
    : 0;
  const [fa, fb] = comparadas ?? [];
  const diferencias = [
    diasEntre ? `${diasEntre} días entre las dos` : "Es la misma foto",
    fa?.peso != null && fb?.peso != null && `${conSigno(fb.peso - fa.peso)} kg`,
    fa?.grasa != null && fb?.grasa != null && `${conSigno(fb.grasa - fa.grasa)} % de grasa`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-3">
        <input
          ref={archivoRef}
          id="foto-archivo"
          type="file"
          accept="image/*"
          hidden
          onChange={elegir}
        />
        <Button onClick={() => archivoRef.current?.click()}>
          <ImagePlus aria-hidden="true" /> Subir una foto
        </Button>
        {fotos.length >= 2 && (
          <Button
            variant="outline"
            onClick={() => setPar([fotos[0].fecha, fotos[fotos.length - 1].fecha])}
          >
            <Columns2 aria-hidden="true" /> Comparar dos fotos
          </Button>
        )}
      </div>

      {fotos.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {fotos.map((f) => {
            const fecha = fechaCorta(f.fecha);
            return (
              <li key={f.fecha} className="grid content-start gap-1.5">
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
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm tabular-nums">{fecha}</span>
                  <span className="flex">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                      aria-label={`Editar nota, peso y grasa de la foto del ${fecha}`}
                      onClick={() => setEditando({ foto: f, valores: edicionDe(f) })}
                    >
                      <Pencil aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Borrar la foto del ${fecha}`}
                      onClick={() => setABorrar(f.fecha)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </span>
                </div>
                <DatosDe foto={f} />
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

      <Dialog open={bmp !== null} onOpenChange={(o) => !o && !subiendo && cerrarSubida()}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <form onSubmit={subir} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Nueva foto de progreso</DialogTitle>
            </DialogHeader>
            <canvas
              ref={setLienzo}
              role="img"
              aria-label="Vista previa de la foto"
              className="mx-auto max-h-80 max-w-full rounded-lg"
            />
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRot((r) => (r + 270) % 360)}
              >
                <RotateCcw aria-hidden="true" /> Rotar a la izquierda
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRot((r) => (r + 90) % 360)}
              >
                <RotateCw aria-hidden="true" /> Rotar a la derecha
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="col-span-2 grid gap-1.5 sm:col-span-1">
                <Label htmlFor="foto-fecha">Fecha</Label>
                <Input
                  id="foto-fecha"
                  name="fecha"
                  type="date"
                  defaultValue={hoy}
                  max={hoy}
                  required
                />
              </div>
              <CamposMedidas prefijo="foto" />
              <div className="col-span-2 grid gap-1.5 sm:col-span-3">
                <Label htmlFor="foto-nota">Nota (opcional)</Label>
                <Input
                  id="foto-nota"
                  name="nota"
                  maxLength={NOTA_MAX}
                  placeholder="ej. semana 8, después del 10K"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Una por día: si subís otra con la misma fecha, reemplaza a la anterior. Solo vos podés
              verlas, y antes de subirlas les borramos la ubicación.
            </p>
            <DialogFooter>
              <DialogClose
                render={
                  <Button type="button" variant="outline" disabled={subiendo}>
                    Cancelar
                  </Button>
                }
              />
              <Button type="submit" loading={subiendo}>
                <ImagePlus aria-hidden="true" /> {subiendo ? "Subiendo…" : "Subir"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={par !== null} onOpenChange={(o) => !o && setPar(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Comparar fotos</DialogTitle>
          </DialogHeader>
          {par && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {([0, 1] as const).map((i) => {
                  const f = comparadas?.[i];
                  return (
                    <div key={i} className="grid content-start gap-2">
                      <Opciones
                        aria-label={i === 0 ? "Primera foto" : "Segunda foto"}
                        value={par[i]}
                        items={items}
                        onChange={(v) => setPar((p) => (p ? (i === 0 ? [v, p[1]] : [p[0], v]) : p))}
                      />
                      {f && (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={f.url}
                            alt={`Foto de progreso del ${fechaCorta(f.fecha)}`}
                            className="aspect-[3/4] w-full rounded-lg bg-muted object-cover"
                          />
                          <DatosDe foto={f} />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">{diferencias}.</p>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={editando !== null}
        onOpenChange={(o) => !o && !guardandoDatos && setEditando(null)}
      >
        <DialogContent>
          <form onSubmit={guardarDatos} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Foto del {editando ? fechaCorta(editando.foto.fecha) : ""}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 grid gap-1.5">
                <Label htmlFor="editar-nota">Nota</Label>
                <Input
                  id="editar-nota"
                  maxLength={NOTA_MAX}
                  value={editando?.valores.nota ?? ""}
                  onChange={(e) => editar("nota", e.target.value)}
                />
              </div>
              <CamposMedidas
                prefijo="editar"
                valores={editando?.valores ?? SIN_DATOS}
                onChange={editar}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Todo es opcional: lo que dejes vacío se borra. El peso también queda en tus registros
              de peso de ese día.
            </p>
            <DialogFooter>
              <DialogClose
                render={
                  <Button type="button" variant="outline" disabled={guardandoDatos}>
                    Cancelar
                  </Button>
                }
              />
              <Button type="submit" loading={guardandoDatos}>
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={aBorrar !== null} onOpenChange={(o) => !o && !borrando && setABorrar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Borrar la foto del {aBorrar ? fechaCorta(aBorrar) : ""}?</DialogTitle>
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

/** Nota y medidas de una foto, debajo de la imagen. */
function DatosDe({ foto }: { foto: Foto }) {
  const medidas = medidasDe(foto);
  return (
    <>
      {medidas && <p className="text-xs tabular-nums">{medidas}</p>}
      {foto.nota && <p className="text-xs break-words text-muted-foreground">{foto.nota}</p>}
    </>
  );
}

/**
 * Peso y % de grasa, opcionales. Sin `valores` son campos sueltos del formulario de subida (con
 * `name`); con `valores`, controlados por el popup de edición.
 */
function CamposMedidas({
  prefijo,
  valores,
  onChange,
}: {
  prefijo: string;
  valores?: Edicion;
  onChange?: (campo: "peso" | "grasa", valor: string) => void;
}) {
  return (
    <>
      {(
        [
          ["peso", "Peso (kg)", 20, 400],
          ["grasa", "% de grasa", 2, 70],
        ] as const
      ).map(([campo, nombre, min, max]) => (
        <div key={campo} className="grid gap-1.5">
          <Label htmlFor={`${prefijo}-${campo}`}>{nombre}</Label>
          <Input
            id={`${prefijo}-${campo}`}
            name={valores ? undefined : campo}
            type="number"
            inputMode="decimal"
            step="0.1"
            min={min}
            max={max}
            placeholder="opcional"
            {...(valores && {
              value: valores[campo],
              onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                onChange?.(campo, e.target.value),
            })}
          />
        </div>
      ))}
    </>
  );
}
