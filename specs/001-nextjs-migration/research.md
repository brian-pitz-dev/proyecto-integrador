# Phase 0 Research: Migración a Next.js con Diseño Renovado

Todas las decisiones de esta sección se validaron contra documentación actual vía
context7 (`/vercel/next.js`, `/supabase/ssr`), no contra conocimiento de entrenamiento,
cumpliendo el Principio II de la constitución.

## 1. Versión de Next.js y estructura de rutas

- **Decision**: Next.js con App Router (`app/`), TypeScript estricto.
- **Rationale**: Es la arquitectura recomendada y por defecto en la documentación
  actual de Next.js (Server Components por defecto, `'use client'` explícito para
  interactividad). El Principio I de la constitución exige explícitamente App Router.
- **Alternatives considered**: Pages Router — descartado por ser el modelo legado;
  no aporta ninguna ventaja para una app nueva y contradice el principio I.

## 2. Server Components vs Client Components

- **Decision**: Las páginas que solo leen datos (listados de registros, calendario,
  estadísticas) se implementan como Server Components que consultan Supabase
  directamente en el servidor. Los formularios de carga (tirada, caminata, calorías,
  peso, sueño) y el toggle de día completado son Client Components pequeños,
  aislados dentro de layouts que siguen siendo Server Components por defecto.
- **Rationale**: La documentación de Next.js indica que los Server Components son el
  default en `app/` y que `'use client'` debe reservarse para estado, manejadores de
  evento y APIs de navegador — exactamente el caso de los formularios de carga
  interactivos. Minimiza el JS enviado al cliente.
- **Alternatives considered**: Todo como Client Components (más simple de portar
  desde el HTML actual, que era 100% cliente) — descartado porque desaprovecha el
  modelo de Next.js y contradice la guía de la documentación oficial.

## 3. Cliente de Supabase para Next.js

- **Decision**: Paquete `@supabase/ssr`, con dos clientes:
  - `createBrowserClient` para los Client Components que hacen mutaciones optimistas
    en el navegador si aplica.
  - `createServerClient` (sin manejo de cookies de sesión, ya que no hay
    autenticación en esta etapa) usado dentro de Server Actions y Server Components
    para leer/escribir en la tabla `registro`.
- **Rationale**: `@supabase/ssr` es el paquete que la documentación actual de
  Supabase recomienda específicamente para frameworks SSR como Next.js, reemplazando
  al viejo `auth-helpers`. Como esta etapa no incluye login (ver Clarifications en
  spec.md), no se implementa el flujo de middleware + cookies de sesión — se usa el
  mismo anon key que ya usa la app actual, tal como lo hace el HTML de hoy.
- **Alternatives considered**: `@supabase/supabase-js` directo sin `@supabase/ssr` —
  viable dado que no hay sesión de usuario que sincronizar vía cookies, pero se
  prefiere `@supabase/ssr` para no bloquear una futura etapa de autenticación
  (ver Assumptions en spec.md) sin tener que reescribir la capa de datos.

## 4. Mutaciones de datos (guardar/borrar registros)

- **Decision**: Server Actions (`'use server'`) para `insert` y `delete` sobre
  `registro`, invocadas desde los formularios de carga. Cada Server Action llama
  `revalidatePath()` sobre las rutas afectadas (calendario, estadísticas) al
  terminar, reemplazando al patrón actual de `refreshStats()` manual tras cada
  `saveLog()`/`deleteLog()`.
- **Rationale**: Es el patrón que la documentación actual de Next.js recomienda para
  mutaciones de formulario en App Router (`<Form action={serverAction}>` +
  `revalidatePath`), evitando exponer un cliente Supabase con capacidad de escritura
  directamente en el bundle del navegador.
- **Alternatives considered**: Mutar desde el cliente con `createBrowserClient`
  (igual que el HTML actual) — descartado como patrón principal porque la
  documentación de Next.js recomienda Server Actions para este caso, pero se
  mantiene disponible como fallback documentado si alguna interacción necesita
  feedback optimista inmediato (ej. animación de guardado).

## 5. Capa de UI y componentes

- **Decision**: shadcn/ui (sobre Radix UI) + Tailwind CSS, siguiendo el "Core Stack"
  documentado por el skill `ui-ux-pro-max` (sub-skill `ui-styling`) para apps
  React/Next.js.
- **Rationale**: Es el stack que la constitución exige seguir (Principio III) y el
  que `ui-ux-pro-max` documenta explícitamente para Next.js: componentes accesibles
  por defecto (Radix), theming consistente, y utilidades Tailwind para el layout
  responsive pedido en la spec (FR-012, SC-004).
- **Alternatives considered**: CSS a medida replicando el HTML actual — descartado,
  contradice directamente el Principio III y el pedido explícito de "mejor diseño
  visual" con `ui-ux-pro-max`.

## 6. No autenticación en esta etapa

- **Decision**: Sin login ni control de acceso; se asume despliegue privado/local
  (confirmado en Clarifications de spec.md). El anon key de Supabase se usa igual
  que hoy, solo que ahora mayormente desde el servidor (Server Actions/Server
  Components) en vez de un `<script>` en el navegador.
- **Rationale**: Decisión explícita del usuario en la sesión de `/speckit-clarify`.
  No agregar auth ahora evita alcance no pedido (regla YAGNI del proyecto).
- **Alternatives considered**: Middleware de sesión con `@supabase/ssr` — descartado
  para esta etapa por no haber usuarios ni login; queda documentado como extensión
  futura de bajo costo dado que ya se eligió `@supabase/ssr` como cliente base.

## Unknowns resueltos

Ningún ítem del Technical Context quedó como `NEEDS CLARIFICATION` — todas las
decisiones técnicas above están resueltas y verificadas contra documentación
vigente.
