# Implementation Plan: Security Hardening & Pre-Deploy Checks

**Branch**: `003-security-hardening` | **Date**: 2026-08-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-security-hardening/spec.md`

## Summary

Cierra el gap de seguridad confirmado en la investigación P0 (RLS con policy "permitir todo", cero auth server-side, `registro` sin `user_id`) antes del deploy en Netlify: login con Supabase Auth (email+password, usuario único, sin registro público), sesión movida a cookies httpOnly vía `@supabase/ssr`, gate de auth server-side en `proxy.ts` (el archivo que reemplazó a `middleware.ts` en Next.js 16 — ver research.md Decisión 1) más una re-verificación en cada server action (Next.js recomienda no confiar solo en el proxy), `user_id` + backfill + policies RLS reales por owner en `registro`, validación `zod` en todos los server actions, rate limiting en memoria + Cloudflare Turnstile en `/login`, y el resto de los checks pendientes (SEO: noindex de previews de Netlify, canonical, og:image; accesibilidad/consola limpia; HTTPS forzado; confirmación de que no hay keys elevadas en el bundle cliente ni SQL armado a mano). Se remueven del working tree (`git rm --cached`, sin reescritura de historial) los dos archivos legacy que ya están trackeados con el anon key hardcodeado.

## Technical Context

**Language/Version**: TypeScript 5 (modo estricto), React 19.2, Next.js 16.3.3 (App Router) — **usa `proxy.ts`, no `middleware.ts`** (deprecado en esta versión, ver research.md Decisión 1)

**Primary Dependencies**: `@supabase/ssr` y `@supabase/supabase-js` ya instalados (uso real de auth recién en esta feature); `zod` — **dependencia nueva**, pedida explícitamente por el usuario para validación de server actions; Cloudflare Turnstile — sin paquete npm, `<script>` + `fetch` server-side al endpoint de siteverify (research.md Decisión 7)

**Storage**: Supabase Postgres — cambio de esquema en `public.registro` (nueva columna `user_id`, backfill, reemplazo de policy RLS) explícitamente aprobado por el usuario en el pedido original de esta feature (Principio IV de la constitución — ver research.md Decisión 3 y `contracts/rls-migration.sql`)

**Testing**: Manual vía `quickstart.md`, consistente con 002-frontend-redesign; sin framework de test en el repo. Dado que es una feature de seguridad, el quickstart incluye explícitamente pasos de camino negativo (acceso sin sesión, queries solo con anon key)

**Target Platform**: Web responsive, deploy en Netlify (producción + previews de rama/PR)

**Project Type**: Web app de un solo proyecto (Next.js App Router, sin split frontend/backend)

**Performance Goals**: Sin objetivo de performance nuevo; el gate de auth en `proxy.ts` no debe agregar latencia perceptible (una sola llamada a `supabase.auth.getUser()` por request, patrón estándar documentado)

**Constraints**: El rate limiting de `/login` es en memoria de proceso, sin backing store nuevo — ceiling documentado (research.md Decisión 6, `# ponytail` en el código); ninguna key con permisos elevados puede llegar al bundle cliente (FR-007)

**Scale/Scope**: Un único usuario final (Brian); 4 páginas protegidas (Registro, Calendario, Estadísticas, Nutrición) + `/login` nueva; 1 tabla con cambio de esquema (`registro`)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principio                                                 | Chequeo                                                                                                                                                                                                                                                                                                                                                                              | Estado                                                             |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| I. Next.js + TypeScript Stack                             | Todo código nuevo (`proxy.ts`, `app/login/`, esquemas `zod`, helper `getAuthedUser()`) va en TS estricto; se sigue la convención vigente de Next.js 16 (`proxy.ts`, no el `middleware.ts` deprecado) en vez de reinventar o usar la convención vieja                                                                                                                                 | PASS                                                               |
| II. Documentación Actualizada vía Context7                | Consultado context7 (`supabase/supabase`) para el patrón `@supabase/ssr` + proxy + cookies `getAll`/`setAll`, y para las policies RLS `auth.uid() = user_id`; consultado `node_modules/next/dist/docs/` para confirmar `proxy.ts` reemplaza a `middleware.ts` en esta versión y para la Metadata API (`robots`/`alternates.canonical`) — ver research.md Decisiones 1-3, 9           | PASS                                                               |
| III. Diseño Visual bajo ui-ux-pro-max                     | La única UI nueva es la pantalla `/login` (formulario email+password+Turnstile) y el mensaje de confirmación destructiva; se implementan con los componentes shadcn/`@base-ui/react` ya instalados por 002, sin introducir un sistema de diseño paralelo                                                                                                                             | PASS (verificar con `ui-ux-pro-max` en implementación de `/login`) |
| IV. Schema de Supabase Inmutable sin Aprobación Explícita | El único cambio de schema (columna `user_id` + backfill + policies) está explícitamente pedido por el usuario en el mensaje que originó esta feature (P0: "agregar columna, backfillear... activar RLS"); el SQL exacto está documentado y aislado en `contracts/rls-migration.sql` para revisión antes de ejecutarse, no se ejecuta ningún otro `ALTER`/`DROP` fuera de ese archivo | PASS                                                               |

**Re-chequeo post-diseño (Fase 1)**: `data-model.md` y `contracts/rls-migration.sql` confirman que el único cambio de schema es exactamente el aprobado (columna `user_id` + 4 policies reemplazando la policy abierta); no se agregó ninguna tabla, columna o política adicional no pedida. Sin violaciones. Gate sigue en PASS.

## Project Structure

### Documentation (this feature)

```text
specs/003-security-hardening/
├── plan.md               # Este archivo
├── research.md            # Fase 0 — 10 decisiones, todas verificadas contra context7/docs de Next.js
├── data-model.md           # Fase 1 — Owner, Registro (+user_id), Session, rate-limit counter
├── contracts/
│   ├── auth-actions.md      # Contrato de login/logout y del gate compartido por los server actions existentes
│   └── rls-migration.sql     # SQL exacto para el cambio de schema aprobado (Principio IV)
├── quickstart.md            # Fase 1 — validación manual por User Story, incluye camino negativo
├── checklists/
│   └── requirements.md
└── tasks.md                # Fase 2 (/speckit-tasks) — no generado por /speckit-plan
```

### Source Code (repository root)

```text
proxy.ts                    # NUEVO — reemplaza middleware.ts (no existe en esta versión de Next.js);
                             # gate de auth server-side para /registro, /calendario, /estadisticas, /nutricion

lib/
├── supabase/
│   ├── server.ts             # MODIFICADO — cookies getAll/setAll reales (hoy es un stub vacío)
│   ├── client.ts              # Sin cambios — createBrowserClient ya sincroniza las mismas cookies
│   ├── proxy.ts                # NUEVO — createServerClient para uso desde proxy.ts (patrón updateSession)
│   └── auth.ts                  # NUEVO — getAuthedUser() compartido por todos los server actions
├── rate-limit.ts               # NUEVO — contador en memoria para /login (FR-008)
└── validation/
    └── registro.ts              # NUEVO — schemas zod para saveLog/deleteLog/toggleDayDone (FR-006)

app/
├── login/
│   ├── page.tsx                 # NUEVO — formulario email+password+Turnstile
│   └── actions.ts                # NUEVO — login()/logout() (ver contracts/auth-actions.md)
├── registro/actions.ts           # MODIFICADO — getAuthedUser() + validación zod + scoping user_id
├── calendario/actions.ts          # MODIFICADO — idem
├── layout.tsx                     # MODIFICADO — metadata base (canonical/robots por defecto, og:image)
├── {registro,calendario,estadisticas,nutricion}/page.tsx  # MODIFICADO — metadata por página (canonical, h1 único)
├── not-found.tsx / sitemap.ts      # Sin cambios de este feature (ya cubiertos en 002)
└── robots.ts                       # NUEVO o MODIFICADO — noindex condicional para previews de Netlify

.gitignore                          # MODIFICADO — agrega Deploy_V1/ y plan_vida_2026.html
Deploy_V1/plan_vida_2026 copy.html  # REMOVIDO del working tree (git rm --cached, no del historial)
plan_vida_2026.html                 # REMOVIDO del working tree (git rm --cached, no del historial)
```

**Structure Decision**: Se mantiene el proyecto Next.js único (App Router). El único archivo nuevo en la raíz es `proxy.ts` (convención de archivo de Next.js 16, ocupa el lugar donde iría `middleware.ts`). El resto de los cambios son: una ruta nueva (`app/login/`), módulos de `lib/` nuevos para auth/validación/rate-limit (sin capa de backend separada — todo corre como Server Components/Actions dentro del mismo proyecto), y ediciones in-place de los `actions.ts` y `page.tsx` existentes para sumar auth, validación y metadata. No se crea `middleware.ts` porque no es un archivo válido en esta versión de Next.js.

## Complexity Tracking

_Sin violaciones de la Constitution Check — sección no aplica._
