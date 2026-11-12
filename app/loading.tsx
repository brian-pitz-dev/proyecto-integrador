import { LoadingScreen } from "@/components/loading-screen";

export default function Loading() {
  return (
    <LoadingScreen
      title="Cargando Bakata"
      detail="Un segundo, ya casi está."
      className="min-h-dvh"
    />
  );
}
