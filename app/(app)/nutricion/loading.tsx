import { LoadingScreen } from "@/components/loading-screen";

export default function Loading() {
  return (
    <LoadingScreen
      title="Cargando tu nutrición"
      detail="Calculando tu meta de calorías y las comidas del día."
    />
  );
}
