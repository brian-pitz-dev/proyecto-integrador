# Specification Quality Checklist: Rediseño de Frontend

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-31
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`.
- Se mencionan `ui-ux-pro-max` y `Supabase` en FR-007/FR-008 porque son restricciones de la constitución del proyecto (Principios III y IV), no elecciones de implementación de esta feature; se dejan como referencia a esas reglas existentes, no como diseño técnico nuevo.
- Todos los ítems pasan en la primera iteración; no hubo necesidad de marcadores [NEEDS CLARIFICATION].

### Actualización 2026-08-31 (ronda de cambios del usuario)

- Se agregaron US2 con dependencia explícita de US1 (P1.5), un edge case y FR-010 sobre SC-004 de la etapa 001, dos Acceptance Scenarios y FR-011 en US4, y una US5 nueva (P3) con FR-012/013/014 de metadata técnica.
- Se detectó y corrigió una inconsistencia de scope: la sección Assumptions decía "no se agregan páginas nuevas", lo cual contradecía el FR-012 (página 404). Se aclaró que la 404 y el sitemap.xml son artefactos técnicos, no páginas de producto.
- FR-012/013/014 mencionan artefactos web estándar (404, sitemap.xml, favicon, `<title>`) sin nombrar tecnología de implementación; se consideran aceptables bajo el mismo criterio que FR-007/008 (referencian estándares/reglas del proyecto, no eligen implementación).
- Re-validado contra los mismos criterios: todos los ítems del checklist siguen en PASS, sin marcadores [NEEDS CLARIFICATION].

### Actualización 2026-08-31 (post-plan: plan de comidas)

- Durante `/speckit-plan` se detectó que "Nutrición" (una de las 3 secciones pedidas para el sidebar) no tenía página real detrás: `/registro` no es una página de nutrición. Investigando `plan_vida_2026.html` se confirmó que existía una página `page-nutri` dedicada (plan de comidas por día, banco de comidas, rotación semanal) que nunca se migró a Next.js en la etapa 001, y quedó sin registrar como decisión de scope.
- El usuario pidió incorporar esa feature ahora al spec 002 en vez de diferirla. Se agregó User Story 5 (Plan de comidas / Nutrición, P2) con FR-015 a FR-018 y SC-006, y se renumeró la antigua User Story 5 (Metadata técnica) a User Story 6.
- Se corrigió Assumptions: ya no dice "no se agregan páginas nuevas" sin matices — ahora aclara que Nutrición es la única página de contenido nueva de esta etapa, que no dispara el Principio IV (schema de Supabase) porque el plan de comidas se modela como constante en código, igual que el plan de gimnasio ya existente (`lib/training-plan.ts`).
- Re-validado: todos los ítems del checklist siguen en PASS. Los nuevos FR-015/016/017/018 son testeables (apuntan a contenido y comportamiento observable: qué se muestra, cómo rota, qué reglas aparecen), no filtran detalles de implementación más allá de referenciar el archivo de origen del contenido a portar (`plan_vida_2026.html`), que es un requisito de dónde viene el dato, no de cómo se codifica.

### Actualización 2026-08-31 (post-plan: navegación por semanas, eventos, rotación)

- El usuario preguntó por 3 cosas más de la app vieja: (1) las pestañas de semana clickeables hasta el 31/dic en Plan de gimnasio y Nutrición, (2) la marca visual de semanas de evento/preparación, (3) el detalle de la rotación aleatoria de comidas y si la semana actual queda fija.
- (1) y (2) resultaron ser otro gap de la migración 001 (nunca se portó la fila de pestañas de semana ni la marca de eventos, aunque los datos de fase/evento ya existen sin usar en `lib/training-plan.ts`). Se agregó User Story 6 (P2) con FR-019/020/021, y una nueva entidad "Semana del plan" en Key Entities.
- (3) se resolvió con el usuario: el algoritmo viejo de rotación (semilla fija, determinístico) ya es estático para siempre una vez calculado, así que "semana actual fija" se cumple automáticamente sin agregar un mecanismo de regenerar/lock nuevo. Se documentó explícitamente en FR-018 para que no quede ambiguo en una futura lectura de la spec.
- User Story "Metadata técnica" se renumeró de US6 a US7 para dejar lugar a la nueva US6.
- Re-validado: todos los ítems siguen en PASS, sin `[NEEDS CLARIFICATION]` — ambas ambigüedades reales de esta ronda (rotación fija vs. regenerable, tipo de selector de semana) se resolvieron con el usuario antes de escribir los FR, no quedaron como marcadores abiertos.
