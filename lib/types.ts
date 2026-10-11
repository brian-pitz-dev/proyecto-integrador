import type { z } from "zod";
import type { categoriaSchema } from "@/lib/validation/registro";

export type Categoria = z.infer<typeof categoriaSchema>;

export interface Registro {
  id: number;
  categoria: Categoria;
  fecha: string; // ISO YYYY-MM-DD
  valor: number;
  nota: string | null;
}

/** Shape común de retorno de los server actions que modifican datos. */
export interface ActionResult {
  ok: boolean;
  message?: string;
}
