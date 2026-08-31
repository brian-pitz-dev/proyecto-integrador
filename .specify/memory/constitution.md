<!--
Sync Impact Report
- Version change: none → 1.0.0 (initial ratification)
- Modified principles: n/a (new document)
- Added sections: Core Principles (I-IV), Governance
- Removed sections: n/a
- Templates requiring updates: none checked against yet (first ratification)
- Follow-up TODOs: TODO(RATIFICATION_DATE) — original adoption date not supplied by user
-->

# PlandeVida2026 Constitution

## Core Principles

### I. Next.js + TypeScript Stack
El proyecto se implementa en Next.js con TypeScript en modo estricto. Todo código
nuevo (páginas, rutas API, componentes, utilidades) MUST estar tipado; no se admite
`any` implícito ni archivos `.js`/`.jsx` en código de aplicación nuevo. Las
convenciones de Next.js (App Router, convenciones de archivos, server/client
components) MUST respetarse en lugar de reinventar soluciones equivalentes.

### II. Documentación Actualizada vía Context7 (NON-NEGOTIABLE)
Antes de implementar cualquier funcionalidad que use APIs, convenciones o
configuración de Next.js o Supabase, MUST consultarse la documentación vigente a
través de context7 (`resolve-library-id` + `query-docs`). No se implementa a partir
de memoria/entrenamiento cuando exista la posibilidad de una API desactualizada o
un cambio reciente; el conocimiento previo del modelo se usa solo como punto de
partida para formular la consulta, nunca como fuente final.

### III. Diseño Visual bajo ui-ux-pro-max
Todo diseño de interfaz (layout, tipografía, color, componentes, accesibilidad,
responsive) MUST seguir las convenciones y el skill `ui-ux-pro-max`. No se introduce
un sistema de diseño, paleta o librería de estilos paralela sin pasar primero por
ese skill.

### IV. Schema de Supabase Inmutable sin Aprobación Explícita
El schema actual de Supabase (tablas, columnas, tipos, políticas RLS, funciones,
triggers) se preserva tal como está. Ninguna migración, `ALTER`, `DROP` o cambio de
schema se ejecuta o se genera como código sin aprobación explícita y previa del
usuario para ese cambio puntual. El código de aplicación se adapta al schema
existente, no al revés.

## Governance

Esta constitución prevalece sobre cualquier otra práctica o preferencia implícita
del código existente. Toda enmienda requiere: (1) propuesta explícita del usuario o
justificación documentada, (2) actualización de este archivo con el Sync Impact
Report correspondiente, (3) incremento de versión según SemVer (MAJOR: eliminación o
redefinición incompatible de un principio; MINOR: principio o sección nueva; PATCH:
aclaración o corrección de redacción).

El cumplimiento de los principios I-IV se verifica antes de cerrar cualquier
feature: stack correcto, documentación consultada vía context7 cuando aplica,
diseño alineado a ui-ux-pro-max, y schema de Supabase sin alteraciones no
aprobadas. Cualquier excepción MUST justificarse por escrito en el PR o commit
correspondiente.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): fecha de adopción original no provista | **Last Amended**: 2026-08-30
