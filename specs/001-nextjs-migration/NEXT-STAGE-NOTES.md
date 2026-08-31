# Notas para la próxima etapa: rediseño de frontend

**Contexto**: la migración a Next.js (001-nextjs-migration) está funcionalmente completa
y probada contra Supabase real (ver `tasks.md`, todas las tareas cerradas). El pase por
`ui-ux-pro-max` de esta etapa cubrió solo iconografía, tipografía y color de acento —
insuficiente para el usuario. El resultado visual actual requiere una revisión más
profunda.

**Feedback del usuario (2026-08-30)**: el resultado del frontend requiere mejoras
importantes, casi al nivel de un cambio completo, en:

- **Paleta de colores** — no alcanza con el acento verde-azulado actual; repensar la
  paleta completa.
- **UX/UI general** — revisión más allá de componentes sueltos.
- **Desplazamiento** (scroll / navegación entre secciones) — cómo se mueve el usuario
  por la app.
- **Animaciones** — hoy prácticamente no hay (solo transiciones CSS básicas de shadcn).
- **Contenido y formato en pantalla** — qué se muestra y cómo se organiza visualmente
  en cada página (registro, calendario, estadísticas).

**Siguiente paso sugerido**: arrancar la próxima sesión con `/speckit-specify` para una
nueva etapa (ej. `002-frontend-redesign`), usando estos cinco ejes como punto de
partida, y correr `ui-ux-pro-max --design-system` de forma completa (con los dials de
`--variance`, `--motion`, `--density`) en vez de una consulta puntual como se hizo en
esta etapa.
