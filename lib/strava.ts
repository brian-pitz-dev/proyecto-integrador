import type { createClient } from "@/lib/supabase/server";
import { formatPace } from "@/lib/pace";

/**
 * Strava (specs/010-strava): OAuth para leer actividades y una importación manual que las pasa a
 * `registro`. Los tokens viven en `strava_conexion` y solo se usan acá, en el servidor.
 */
type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Permiso que se pide: leer actividades, también las privadas (muchas corridas son "solo yo"). */
export const SCOPE = "activity:read_all";
/** La primera importación trae lo de los últimos 30 días. */
const DIAS_PRIMERA = 30;
const POR_PAGINA = 100;
const MAX_PAGINAS = 3;

export const stravaConfigurado = () =>
  !!process.env.STRAVA_CLIENT_ID && !!process.env.STRAVA_CLIENT_SECRET;

export function urlAutorizacion(redirectUri: string, state: string): string {
  const url = new URL("https://www.strava.com/oauth/authorize");
  url.search = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: SCOPE,
    state,
  }).toString();
  return url.toString();
}

interface Tokens {
  access_token: string;
  refresh_token: string;
  /** segundos epoch */
  expires_at: number;
  athlete?: { id: number };
}

async function pedirToken(params: Record<string, string>): Promise<Tokens> {
  const r = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID ?? "",
      client_secret: process.env.STRAVA_CLIENT_SECRET ?? "",
      ...params,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!r.ok) throw new Error(`strava token ${r.status}`);
  return r.json();
}

/** Canjea el `code` del callback y guarda la conexión del usuario. */
export async function conectar(supabase: Supabase, userId: string, code: string) {
  const t = await pedirToken({ code, grant_type: "authorization_code" });
  if (!t.athlete?.id) throw new Error("strava: falta el atleta");
  const { error } = await supabase.from("strava_conexion").upsert({
    user_id: userId,
    athlete_id: t.athlete.id,
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expires_at: new Date(t.expires_at * 1000).toISOString(),
    ultima_actividad: null,
  });
  if (error) throw error;
}

interface Conexion {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  ultima_actividad: string | null;
}

/** Token de acceso vigente: si vence en menos de un minuto, lo renueva y lo guarda. */
async function tokenVigente(supabase: Supabase, userId: string, c: Conexion): Promise<string> {
  if (new Date(c.expires_at).getTime() - Date.now() > 60_000) return c.access_token;
  const t = await pedirToken({ refresh_token: c.refresh_token, grant_type: "refresh_token" });
  const { error } = await supabase
    .from("strava_conexion")
    .update({
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      expires_at: new Date(t.expires_at * 1000).toISOString(),
    })
    .eq("user_id", userId);
  if (error) throw error;
  return t.access_token;
}

export interface ActividadStrava {
  sport_type: string;
  /** metros */
  distance: number;
  /** segundos en movimiento */
  moving_time: number;
  /** UTC, ISO */
  start_date: string;
  /** hora local del atleta, con "Z" aunque no sea UTC: "2026-11-13T07:30:00Z" */
  start_date_local: string;
}

const CORRIDAS = new Set(["Run", "TrailRun", "VirtualRun"]);
const CAMINATAS = new Set(["Walk", "Hike"]);

export interface RegistroStrava {
  categoria: "tirada" | "caminata";
  fecha: string;
  valor: number;
  nota: string | null;
}

/**
 * Corridas → "tirada", con "{tiempo} · {ritmo}/km" en la nota como el formulario de la app (así
 * cuentan en el ritmo promedio y en la predicción de carrera); caminatas → "caminata". El resto
 * (bici, gym, natación) y lo de menos de 500 m se ignora.
 */
export function aRegistros(actividades: ActividadStrava[]): RegistroStrava[] {
  return actividades.flatMap((a): RegistroStrava[] => {
    const km = Math.round(a.distance / 10) / 100;
    if (km < 0.5) return [];
    const fecha = a.start_date_local.slice(0, 10);
    if (CAMINATAS.has(a.sport_type))
      return [{ categoria: "caminata", fecha, valor: km, nota: null }];
    if (!CORRIDAS.has(a.sport_type) || a.moving_time <= 0) return [];
    const hs = Math.floor(a.moving_time / 3600);
    const min = Math.round((a.moving_time % 3600) / 60);
    const tiempo = hs > 0 ? `${hs}h ${min}min` : `${min}min`;
    return [
      {
        categoria: "tirada",
        fecha,
        valor: km,
        nota: `${tiempo} · ${formatPace(a.moving_time / km)}`,
      },
    ];
  });
}

/**
 * Trae de Strava las actividades posteriores a la última importada (la primera vez, las de los
 * últimos 30 días) y las carga en `registro`. Devuelve cuántas cargó; null si no está conectado.
 */
export async function importar(supabase: Supabase, userId: string): Promise<number | null> {
  const { data: c, error } = await supabase
    .from("strava_conexion")
    .select("access_token, refresh_token, expires_at, ultima_actividad")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!c) return null;

  const token = await tokenVigente(supabase, userId, c);
  const desde = c.ultima_actividad
    ? new Date(c.ultima_actividad).getTime() + 1000 // un segundo después: la última ya está
    : Date.now() - DIAS_PRIMERA * 86_400_000;
  const actividades: ActividadStrava[] = [];
  for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
    const url = new URL("https://www.strava.com/api/v3/athlete/activities");
    url.search = new URLSearchParams({
      after: String(Math.floor(desde / 1000)),
      per_page: String(POR_PAGINA),
      page: String(pagina),
    }).toString();
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) throw new Error(`strava actividades ${r.status}`);
    const lote: ActividadStrava[] = await r.json();
    actividades.push(...lote);
    if (lote.length < POR_PAGINA) break;
  }
  if (!actividades.length) return 0;

  const registros = aRegistros(actividades);
  if (registros.length) {
    const { error: e } = await supabase
      .from("registro")
      .insert(registros.map((r) => ({ ...r, user_id: userId })));
    if (e) throw e;
  }
  // shortcut: si esto falla después del insert, la próxima importación las vuelve a traer
  // (duplicadas); guardar el id de Strava en cada registro lo evitaría.
  const ultima = actividades
    .map((a) => a.start_date)
    .sort()
    .at(-1)!;
  const { error: e } = await supabase
    .from("strava_conexion")
    .update({ ultima_actividad: ultima })
    .eq("user_id", userId);
  if (e) throw e;
  return registros.length;
}

/**
 * Revoca el acceso en Strava (si falla, se sigue: el usuario igual quiere cortar) y borra la
 * conexión. Los registros ya importados quedan.
 */
export async function desconectar(supabase: Supabase, userId: string) {
  const { data: c } = await supabase
    .from("strava_conexion")
    .select("access_token, refresh_token, expires_at, ultima_actividad")
    .eq("user_id", userId)
    .maybeSingle();
  if (!c) return;
  try {
    const r = await fetch("https://www.strava.com/oauth/deauthorize", {
      method: "POST",
      body: new URLSearchParams({ access_token: await tokenVigente(supabase, userId, c) }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) throw new Error(`strava deauthorize ${r.status}`);
  } catch (e) {
    console.error("strava deauthorize", e);
  }
  const { error } = await supabase.from("strava_conexion").delete().eq("user_id", userId);
  if (error) throw error;
}
