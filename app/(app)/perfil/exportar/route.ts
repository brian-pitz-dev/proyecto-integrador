import { NextResponse } from "next/server";
import { z } from "zod";
import { claveActualSchema, verificarClave } from "@/lib/verificar-clave";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { todayNormalized, toISO } from "@/lib/date";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Todas las filas de `tabla` del usuario, de a páginas: PostgREST corta cada respuesta (1000 filas). */
async function todas(supabase: Supabase, tabla: string, userId: string, orden: string[]) {
  const filas: unknown[] = [];
  for (;;) {
    let q = supabase.from(tabla).select("*").eq("user_id", userId);
    for (const col of orden) q = q.order(col);
    const { data, error } = await q.range(filas.length, filas.length + 999);
    if (error) throw error;
    // hasta que venga vacía: si el server corta en menos de 1000, igual sigue pidiendo
    if (!data.length) return filas;
    filas.push(...data);
  }
}

/**
 * Descarga de todos los datos del usuario en JSON (derecho de acceso, ver /privacidad). POST con
 * la contraseña en el body: una sesión abierta en otra compu no alcanza para llevarse todo.
 */
export async function POST(request: Request) {
  // proxy.ts ya exige sesión, pero cada handler que lee datos lo verifica por su cuenta.
  const user = await getAuthedUser();
  if (!user?.email) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const parsed = z.object({ password: claveActualSchema }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Escribí tu contraseña." }, { status: 400 });
  }

  const supabase = await createClient();
  const rechazo = await verificarClave(supabase, user.email, parsed.data.password);
  if (rechazo) return NextResponse.json({ error: rechazo }, { status: 403 });

  try {
    const [perfil, eventos, registros, planesIa, usoIa] = await Promise.all([
      todas(supabase, "perfil", user.id, ["user_id"]),
      todas(supabase, "evento", user.id, ["fecha", "id"]),
      todas(supabase, "registro", user.id, ["fecha", "id"]),
      todas(supabase, "plan_ia", user.id, ["tipo"]),
      todas(supabase, "uso_ia", user.id, ["fecha"]),
    ]);
    const datos = {
      exportado: new Date().toISOString(),
      cuenta: { id: user.id, nombre: user.nombre, email: user.email },
      perfil: perfil[0] ?? null,
      eventos,
      registros,
      planesIa,
      usoIa,
    };
    return new NextResponse(JSON.stringify(datos, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="bakata-${toISO(todayNormalized())}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("exportar", error);
    return NextResponse.json({ error: "No se pudieron exportar los datos." }, { status: 500 });
  }
}
