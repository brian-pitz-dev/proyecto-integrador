import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { stravaConfigurado, urlAutorizacion } from "@/lib/strava";

/** Manda a Strava a pedir permiso. El `state` va en una cookie para que el callback lo compare (CSRF). */
export async function GET(request: NextRequest) {
  const user = await getAuthedUser();
  if (!user) redirect("/login");
  if (!stravaConfigurado()) redirect("/estadisticas");

  const state = crypto.randomUUID();
  (await cookies()).set("strava_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/strava",
  });
  redirect(urlAutorizacion(`${request.nextUrl.origin}/strava/callback`, state));
}
