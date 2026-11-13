import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { SCOPE, conectar } from "@/lib/strava";

/** Vuelta de Strava: verifica el `state`, canjea el código y guarda la conexión. */
export async function GET(request: NextRequest) {
  const user = await getAuthedUser();
  if (!user) redirect("/login");

  const params = request.nextUrl.searchParams;
  const jar = await cookies();
  const state = jar.get("strava_state")?.value;
  jar.delete({ name: "strava_state", path: "/strava" });
  if (!state || params.get("state") !== state) redirect("/estadisticas?strava=error#strava");

  const code = params.get("code");
  // "Cancelar" en Strava vuelve con error=access_denied
  if (params.get("error") || !code) redirect("/estadisticas?strava=cancelado#strava");
  // el usuario puede destildar el permiso de actividades en la pantalla de Strava
  if (!(params.get("scope") ?? "").split(",").includes(SCOPE)) {
    redirect("/estadisticas?strava=permiso#strava");
  }

  let ok = true;
  try {
    await conectar(await createClient(), user.id, code);
  } catch (error) {
    console.error("strava conectar", error);
    ok = false;
  }
  redirect(ok ? "/estadisticas?strava=conectado#strava" : "/estadisticas?strava=error#strava");
}
