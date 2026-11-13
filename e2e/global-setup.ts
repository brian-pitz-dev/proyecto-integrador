import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ANIO_E2E, ESTADO } from "./datos";

/**
 * Inicia sesión con la cuenta de prueba directo contra Supabase, sin el formulario (Turnstile no
 * deja pasar a un navegador automático en CI), y guarda las mismas cookies que arma la app con
 * @supabase/ssr. De paso borra lo que haya dejado una corrida anterior que falló a la mitad.
 */
export default async function globalSetup() {
  const { E2E_EMAIL, E2E_PASSWORD, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } =
    process.env;
  if (!E2E_EMAIL || !E2E_PASSWORD || !NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      "Faltan E2E_EMAIL, E2E_PASSWORD o las variables de Supabase (ver .env.example).",
    );
  }

  const cookies = new Map<string, string>();
  const supabase = createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
      setAll: (nuevas) =>
        nuevas.forEach(({ name, value }) =>
          value ? cookies.set(name, value) : cookies.delete(name),
        ),
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: E2E_EMAIL,
    password: E2E_PASSWORD,
  });
  if (error || !data.user) {
    throw new Error(`No se pudo iniciar sesión con la cuenta E2E: ${error?.message}`);
  }
  const meta = data.user.user_metadata ?? {};
  if (!meta.onboarding_completed) {
    throw new Error("La cuenta E2E no terminó el registro: entrá una vez con ella desde /login.");
  }
  if (!meta.tutorial_visto) {
    // el tutorial se abre solo la primera vez y taparía la página; la app lo lee del JWT
    await supabase.auth.updateUser({ data: { tutorial_visto: true } });
    await supabase.auth.refreshSession();
  }

  await limpiar(supabase, data.user.id);

  if (!cookies.size) throw new Error("Supabase no devolvió la sesión.");
  mkdirSync(dirname(ESTADO), { recursive: true });
  writeFileSync(
    ESTADO,
    JSON.stringify({
      cookies: [...cookies].map(([name, value]) => ({
        name,
        value,
        domain: "localhost",
        path: "/",
        expires: -1,
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      })),
      origins: [],
    }),
  );
}

/** Borra los registros y las fotos que dejan los tests (todo con fecha de ANIO_E2E). */
async function limpiar(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase
    .from("registro")
    .delete()
    .eq("user_id", userId)
    .gte("fecha", `${ANIO_E2E}-01-01`)
    .lte("fecha", `${ANIO_E2E}-12-31`);
  if (error) throw error;

  const { data: fotos, error: errorFotos } = await supabase.storage
    .from("fotos-progreso")
    .list(userId, { search: `${ANIO_E2E}-` });
  if (errorFotos) throw errorFotos;
  if (fotos.length) {
    await supabase.storage.from("fotos-progreso").remove(fotos.map((f) => `${userId}/${f.name}`));
  }
}
