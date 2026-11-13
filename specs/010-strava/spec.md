# Feature Specification: Importar de Strava

**Feature**: `010-strava` | **Created**: 2026-11-13 | **Status**: Implementado; falta crear la app de Strava y aplicar la migración (ver quickstart)

**Input**: "Importar corridas de Strava" para no cargarlas a mano. Se eligió un botón
"Importar de Strava" en vez de un webhook.

## User Stories

### US1 — Conectar Strava (P1)

En Estadísticas, arriba de Registros, "Conectar con Strava" lleva a Strava a pedir permiso para
leer actividades (también las privadas) y vuelve con un aviso: conectado, cancelado, sin el
permiso de actividades o error.

### US2 — Importar (P1)

"Importar de Strava" trae las actividades nuevas desde la última importación (la primera vez,
las de los últimos 30 días) y avisa cuántas cargó:

- Corridas (`Run`, `TrailRun`, `VirtualRun`) → `registro` "tirada", con
  "{tiempo} · {ritmo}/km" en la nota, igual que el formulario: cuentan en el ritmo promedio, la
  evolución y la predicción de carrera.
- Caminatas (`Walk`, `Hike`) → "caminata".
- El resto (bici, gym, natación) y lo de menos de 500 m se ignora.
- La fecha es la local del atleta (`start_date_local`), no la UTC.

### US3 — Desconectar (P2)

"Desconectar" revoca el permiso en Strava y borra la conexión. Lo importado queda. Borrar la
cuenta también lo revoca.

## Decisiones

1. **Botón y no webhook**: no hace falta un endpoint público ni la suscripción de Strava.
2. **Tabla `strava_conexion`** (migración `20261113200000_strava.sql`): una fila por usuario con
   los tokens, RLS por dueño y cascade con la cuenta. Los tokens solo los usa el servidor
   (`lib/strava.ts`); el secreto de la app nunca llega al navegador.
3. **OAuth con `state` en una cookie** httpOnly (`/strava/conectar` → Strava →
   `/strava/callback`) contra CSRF.
4. **Sin id de Strava en `registro`**: no se agregó una columna. Se recuerda el inicio de la
   última actividad importada (`ultima_actividad`) y la próxima pide las posteriores. Si el
   usuario ya había cargado una corrida a mano, queda repetida (la tarjeta lo avisa).
5. **Límites**: 3 importaciones por minuto por usuario (la API de Strava da 100 pedidos cada 15
   minutos por app), hasta 300 actividades por importación.
6. **Sin `STRAVA_CLIENT_ID`/`STRAVA_CLIENT_SECRET`** la tarjeta no aparece.
7. "Descargar mis datos" incluye la conexión sin los tokens.

## Fuera de alcance

- Importación automática (webhook) y editar o borrar en Strava.
- Otras plataformas (Garmin, Apple Health).
- Mientras la app de Strava no pase la revisión de Strava, solo puede conectarla su dueño
  (Strava limita las apps nuevas a un atleta).
