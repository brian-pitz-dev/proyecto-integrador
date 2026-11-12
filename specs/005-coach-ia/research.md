# Research: Coach IA

## Decisión 1 — Proveedor: Google Gemini, tier gratis, sin facturación

Anthropic/Claude no tiene tier gratis, y por eso se descartó el plan anterior basado en
`ANTHROPIC_API_KEY` (Fase B/C de spec 004). Las opciones gratis sin tarjeta que se
evaluaron:

- **Gemini**: el elegido, por calidad en español y salida JSON con schema.
- **Groq**: no entrena con los datos, pero sus límites son más chicos.

Al 2026-11, `aistudio.google.com/docs/pricing` lista `gemini-3.8-flash` como gratis. Se
puede cambiar con `GEMINI_MODEL` si Google lo depreca: `gemini-2.5-*` ya redirige a
modelos 3.x desde el 2026-12-01.

**Por qué es gratis de verdad**: la key sale de un proyecto **sin billing**. Al pasar el
límite gratis, Google devuelve 429 y no cobra. La app muestra ese 429 como "límite gratis
por ahora".

**Lo que se acepta a cambio**: en el tier gratis Google puede usar los prompts para
mejorar sus productos. Para acotarlo:

- se manda `store: false`;
- no se mandan ni email ni nombre;
- la UI lo avisa.

API: Interactions API (`POST /v1beta/interactions`, header `Api-Revision: 2026-05-20`),
con `response_format` (JSON Schema) para la salida estructurada. Se llama con `fetch`,
sin SDK, en `lib/ai.ts`. El JSON Schema se deriva de los mismos schemas zod con
`z.toJSONSchema`. Gemini aplica `minItems/maxItems/minimum/maximum` y descarta
`minLength/maxLength`, así que eso se valida igual con zod.

### Hallazgos de la prueba real (2026-11-12)

- **Cuenta institucional**: una key creada con la cuenta de la facultad dio 403 ("free tier
  not available for this project"). Google decide quién califica por proyecto/cuenta. Con
  una cuenta personal de Gmail funcionó. **No hay que activar facturación**: no habilita el
  tier gratis y pasa a cobrar todo.
- **`gemini-3.8-flash` daba 503** ("high demand") seguido, así que el modelo por defecto es
  `gemini-3.6-flash`. Hay fallback a `gemini-3.5-flash-lite` y `gemini-3.1-flash-lite` ante
  503, 429 o timeout (cada modelo tiene su propia cuota gratis). El presupuesto total es de
  50 s, porque una función de Netlify corta a los 60 s y ese límite no se puede cambiar.
- **Schema "too many states"**: Gemini rechazó el schema de comidas por los límites
  numéricos y de largo anidados. Ahora `toGeminiSchema` le manda solo la forma (sin
  `minimum/maximum/minLength/maxLength/minItems/maxItems`); los límites quedan en el prompt
  y zod los aplica.
- **La salida varía**:
  - A veces la IA devuelve menos platos de los pedidos. "Armar plan nuevo" completa hasta 3
    por tipo con el banco base y garantiza un almuerzo con `carbLoad`.
  - Los textos que solo se muestran (nombres, `sets`) se recortan con "…" en vez de
    rechazar todo el plan.

## Decisión 2 — Cuota diaria en Postgres, con el límite hardcodeado en SQL

`lib/rate-limit.ts` guarda los contadores en memoria y se resetean en cada cold start,
así que sirve para el límite por minuto pero no para el diario. El diario usa la tabla
`uso_ia` con RLS de solo SELECT y la función `consumir_uso_ia()` (security definer, upsert
atómico con `where usos < 20`).

El límite va **dentro** de la función: `supabase.rpc()` se puede llamar desde el
navegador con la anon key, así que un parámetro `limite` se podría falsear.

El orden es: primero se chequea si queda cuota, después se llama a la IA, y recién si
respondió bien se consume el uso. Una carrera entre requests paralelas queda acotada por
el límite de 5 por minuto.

## Decisión 3 — Banco IA como jsonb, con la misma forma que las constantes

`plan_ia(user_id, tipo, contenido jsonb)` guarda un `MealBank`
(`Record<MealType, Meal[]>`) o un `Record<gymKey, Routine>`, que son exactamente las
formas que ya consumen `getMealsForDay` y `ExerciseBlock`. Así no hacen falta tablas por
plato ni código de mapeo.

- La rotación (`buildRecencySequence`) se cachea por `(largo, seed)`. Con el banco base
  da los mismos índices de siempre.
- Los platos de la IA usan `id: "ia"` más `nombre`, así nunca chocan con las claves de
  `ingredienteNutri` (por ejemplo "pollo"), y sus totales vienen de `proteinG`/`kcal`.
- "Agregar" copia el banco actual (base o IA) y le suma lo nuevo, hasta 15 platos por
  tipo.

## Decisión 4 — Escalado de porciones y umbral de proteína

- `ingredienteNutri` suma `kcal100` aproximados, en la misma base (crudo/cocido) que el
  `prote100` original. Son valores de referencia y hay que revisarlos contra las
  etiquetas reales.
- El factor del día es `meta / kcal base`, acotado a [0.75, 1.3] y redondeado a 0.05.
  Se calcula en 2 pasadas, descontando las kcal del refuerzo de proteína, que no se
  escala. Medido con metas de 1900 a 3000 kcal, el total queda a 2.6% de la meta en
  mediana y nunca a más de 8.6% cuando el factor no topa.
- Los huevos se escalan de a 50 g (`unidadG`) y el resto de a 5 g. Batido y leche
  proteica son porciones fijas.
- El umbral del almuerzo es `round(peso × 0.58)`. El 0.58 sale de que 55 g / 94.9 kg (el
  peso inicial de Brian) dé los mismos 55 g de siempre a ese peso. El objetivo diario
  mostrado es 1.8 g/kg.
- Self-check: `node scripts/check-meal-scaling.mjs` (Node ≥ 23 importa `.ts` directo).

## Decisión 5: latencia (cada ingreso o salida tardaba ~6 s)

**Medición** (2026-11-12): las funciones de Netlify corren en `us-east-2` (Ohio) y Supabase
en `sa-east-1` (San Pablo), y el usuario está en Buenos Aires. El proxy corre como edge
function, cerca del usuario, así que es barato. Las páginas y las Server Actions corren en
Ohio y cada consulta a Supabase cruza el continente.

En el plan Free no se puede cambiar la región de las funciones (es una opción de Pro y
Enterprise).

Antes, el login hacía 3 viajes:

1. la acción;
2. `router.push`, con un render completo;
3. `router.refresh`, con otro render completo de la misma página.

Además, cada render volvía a validar la sesión contra Supabase Auth con `getUser()`.
Sumado al cold start de una función con poco tráfico, daba ~6 s.

**Cambios:**

- **Login, logout, signup y onboarding**: hacen `redirect()` desde la Server Action. La
  acción y la página destino viajan en una sola respuesta. Ese render no pasa por
  `proxy.ts`, así que `login` decide `/calendario` u `/onboarding` según
  `user_metadata.onboarding_completed`.
- **`getAuthedUser()`** (Server Actions y páginas) usa `getClaims()`. El proyecto tiene
  claves asimétricas ES256 (`/auth/v1/.well-known/jwks.json`), así que la firma del JWT se
  verifica localmente con el JWKS cacheado, sin ir a Supabase Auth.
  - Lo que se acepta a cambio: una sesión revocada del lado de Auth sigue valiendo hasta que
    vence el JWT (1 h como máximo).
  - Se mantiene igual: el control de dos capas de spec 003 (proxy más un chequeo en cada
    acción), el uso de `getUser()` en `proxy.ts` (fresco, porque lee `onboarding_completed`)
    y RLS en todas las tablas.

**Pendiente si sigue lento**: el cold start de la función de Next en Netlify Free no se
puede evitar. Si molesta, las opciones son pasar las funciones a `sa-east-1` (Netlify Pro)
o desplegar en un proveedor que permita elegir región en el plan gratis.
