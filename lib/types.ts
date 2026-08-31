export type Categoria =
  | "tirada"
  | "caminata"
  | "calorias"
  | "peso"
  | "sueno"
  | "completado";

export interface Registro {
  id: number;
  categoria: Categoria;
  fecha: string; // ISO YYYY-MM-DD
  valor: number;
  nota: string | null;
}
