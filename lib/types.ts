export type Categoria =
  | "tirada"
  | "caminata"
  | "calorias"
  | "peso"
  | "sueno"
  | "completado"
  | "evento";

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
