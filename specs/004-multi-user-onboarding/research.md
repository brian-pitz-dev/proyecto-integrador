# Phase 0 Research: Multi-User Onboarding & Personalized Plan Generation

Alcance de esta investigación: **núcleo** (US1/US2/US3 del spec — signup, onboarding,
plan personalizado por usuario, migración de la cuenta de Brian). US4 (comidas/
ejercicios editables por usuario, vía IA) y US5 (gestión completa de eventos) quedan
fuera de este corte — ver "Fases B/C/D" al final.

## Decisión 1 — Cómo generalizar las 6 fases: resolución de la Open Design Question

El spec dejaba abierta a propósito la pregunta de cómo pasar de fases ancladas a
fechas de calendario fijas (`PLAN_START`/`PLAN_END`, 3 eventos hardcodeados) a fases
relativas a los eventos propios de cada usuario, con varias sub-preguntas sin
resolver (evento "primario" entre varios, compresión cuando falta poco tiempo,
huecos entre eventos, si la metodología debe flexionar por tipo/distancia de
evento).

**Decisión**: cada usuario tiene su propio `plan_start` (fecha en la que arranca a
entrenar — para cuentas nuevas, el día que termina el onboarding; para la cuenta de
Brian, su fecha histórica real 2026-08-17) y su propia lista de eventos. El motor
(`buildPlan` en `lib/training-plan.ts`) recorre los eventos ordenados por fecha y
arma un bloque secuencial por evento:

- **Carrera corta** (`distanciaKm < 15`): reusa `phase1Week` (ideal 4 semanas, sin
  taper) — así se trataba el 10K.
- **Carrera larga** (`distanciaKm >= 15`): `phase4Week` (ideal 3 semanas de
  construcción) + `phase5Week` (ideal 1 semana de taper, nunca se comprime salvo que
  quede ≤1 semana disponible) — así se trataba el 21K.
- **Caminata**: `phase2Week` (ideal 3 semanas) — así se trataba Luján.
- **Recuperación** (`phase3Week`, 1 semana): después de cualquier evento, **excepto**
  cuando una carrera es seguida inmediatamente por una caminata (el bloque de
  caminata ya es de baja intensidad y cumple esa función) — así es como hoy no hay
  semana de recuperación entre el 10K y Luján.
- **Mantenimiento** (`phase6Week`): abierto/indefinido después del último evento,
  recalculado en cada llamada para cubrir siempre ≥12 semanas por delante de "hoy"
  (reemplaza el corte fijo del 31/dic/2026).
- **Compresión**: si hay menos semanas disponibles que el ideal, se usan las últimas
  N entradas del array de contenido (las más cercanas al evento); si sobran, se
  rellena el frente con contenido de mantenimiento.

**Rationale**: el spec asume explícitamente que "la metodología de 6 fases... se
mantiene como la misma plantilla para todo el sistema; lo que cambia por usuario es
qué fechas de calendario ocupa cada fase" (Assumptions de spec.md). Eso reduce el
problema a re-fechar el mismo contenido (`phase1Week`..`phase6Week`, sin tocarlos),
no a generar contenido nuevo por usuario.

**Dos bugs encontrados y corregidos durante el diseño** (ambos detectados corriendo
el algoritmo contra las fechas reales de Brian, no solo razonando en abstracto):

1. Una regla de "recuperación después de todo evento" rompía la secuencia real de
   Brian — no hay semana de recuperación entre el 10K y Luján en el plan original.
   Fix: la regla de skip de arriba (`carrera` → `caminata` inmediato).
2. Un umbral basado solo en "semanas disponibles" no alcanza para distinguir el 10K
   del 21K (ambos bloques tienen igual cantidad de semanas disponibles en los datos
   reales de Brian) — la señal real es la **distancia**, no el tiempo hasta la
   carrera. Fix: branch por `distanciaKm >= 15`.

**Verificación numérica**: corrida con los 3 eventos reales de Brian (`plan_start`
2026-08-17) vía un script `tsx` ad-hoc, comparado semana a semana contra el
`phaseDefs` hardcodeado original — coincide exactamente (4,3,1,3,1,1,8+ semanas,
mismas fases, mismas semanas de evento/preparación). Pasos reproducibles en
`quickstart.md`.

**Alternativas consideradas**:

- Elegir un único evento "primario" e ignorar el resto — rechazado, pierde la
  estructura secuencial de bloques que el plan original de Brian ya tiene (3 eventos
  en secuencia, cada uno con su propio bloque).
- Dejar que cada usuario defina manualmente la duración de cada fase — rechazado por
  ahora (mucho más esfuerzo de UI), coherente con que US4/US5 quedan fuera de este
  corte.

## Decisión 2 — Texto del día de evento: `etiqueta`/`detalle` opcionales, no hardcodear

`eventOverrideFor` necesitaba mostrar un texto genérico para eventos de cualquier
usuario (`CARRERA — {nombre}`, `{distanciaKm} km · ritmo conservador...`), pero la
migración de Brian tiene que reproducir el texto original exacto ("CARRERA 10K",
"Objetivo: menos de 1:00:00..."). Se agregaron dos columnas opcionales a `evento`
(`etiqueta`, `detalle`) que, si están presentes, pisan la plantilla genérica — así la
migración de Brian no pierde fidelidad de texto sin forzar a cada usuario nuevo a
escribir el suyo.

## Decisión 3 — `onboarding_completed` en `user_metadata`, no en una tabla

El gate de onboarding en `proxy.ts` necesita saber si el usuario ya completó el
onboarding en **cada request** a una ruta protegida. Guardar ese flag en
`auth.users.user_metadata` (vía `supabase.auth.updateUser()`) en vez de inferirlo con
un `select` a `perfil` evita una query extra a la base en cada request — el dato ya
viaja en el objeto `user` que `proxy.ts` obtiene de `supabase.auth.getUser()`, sin
costo adicional.

## Decisión 4 — Mifflin-St Jeor: bug de sexo encontrado y corregido

La fórmula de `lib/calorie-target.ts` existente (`10*peso + 6.25*altura - 5*edad +
5`) es la fórmula de Mifflin-St Jeor **solo para hombres** — no tenía ningún branch
por sexo (irrelevante mientras el único usuario era Brian). Al generalizar a
`UserProfile.sexo`, se corrigió: `+5` para `M`, `-161` para `F`.

## Decisión 5 — `ROTATION_SLOTS` fijo y generoso en vez de derivado de `getWeeks()`

`lib/meal-plan.ts` calculaba `ROTATION_SLOTS` a nivel de módulo a partir de
`getWeeks().length` — ya no existe "el" plan al cargar el módulo (cada usuario tiene
el suyo). Se reemplazó por una constante fija (`1040 * 5 + 10`, ~20 años). Es seguro
para la migración de Brian: la secuencia `mulberry32` es estrictamente secuencial (el
valor en el slot `t` depende solo de los slots anteriores y la semilla, nunca del
total), así que alargarla solo agrega valores después de los que su plan actual ya
usa — no cambia ningún valor existente.

## Decisión 6 — Deploy: Netlify, conectado a GitHub para deploy continuo

Confirmado por el comentario ya existente en `lib/rate-limit.ts` ("fine for a
single-instance Netlify deploy") y por tener el CLI de Netlify ya instalado — se creó
un sitio nuevo (`bakata`, separado del sitio personal preexistente `plandevida2026`
del dueño, que no se tocó) y se conectó a `brian-pitz-dev/proyecto-integrador` para
deploy automático en cada push a `main`. Las 5 env vars (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
`TURNSTILE_SECRET`, `TURNSTILE_HOSTNAMES`) se cargaron vía `netlify env:set`. El
widget de Turnstile de producción reusa el mismo par site-key/secret que el de
desarrollo local, con `bakata.netlify.app` agregado como segundo dominio permitido en
el mismo widget de Cloudflare (Turnstile soporta múltiples dominios por widget).

## Fases B/C/D (fuera de este corte)

- **Fase B/C** (comidas/ejercicios generados por IA): requieren `ANTHROPIC_API_KEY`,
  todavía no disponible — diseño en el plan de implementación
  (`.claude/plans/enumerated-humming-iverson.md`), investigación de decisiones
  concretas (modelo, prompt, schema de tool use) queda para cuando se implementen.
- **Fase D** (fotos de progreso): requiere crear un bucket de Supabase Storage y sus
  políticas — también pendiente de implementación.
