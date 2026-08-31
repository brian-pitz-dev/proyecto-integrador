# Feature Specification: Rediseño de Frontend

**Feature Branch**: `002-frontend-redesign`

**Created**: 2026-08-31

**Status**: Draft

**Input**: User description: "002-frontend-redesign: Rediseño completo del frontend de PlandeVida2026 (post migración a Next.js, etapa 001-nextjs-migration ya cerrada). Basado en feedback del usuario del 2026-08-30, el rediseño debe cubrir cinco ejes: (1) Paleta de colores, (2) UX/UI general, (3) Desplazamiento (scroll/navegación entre secciones), (4) Animaciones, (5) Contenido y formato en pantalla en cada página (registro, calendario, estadísticas). El paso de ui-ux-pro-max en la etapa anterior fue insuficiente (solo iconografía, tipografía y color de acento); esta etapa corre ui-ux-pro-max --design-system de forma completa."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Nueva paleta e identidad visual coherente (Priority: P1)

Como usuario de la app, quiero que todas las pantallas (inicio, registro, calendario, estadísticas) compartan una paleta de colores y un lenguaje visual coherente y distintivo, en lugar del acento verde-azulado actual percibido como insuficiente, para que la app se sienta terminada y con identidad propia.

**Why this priority**: Es el cambio más visible y el disparador explícito del feedback del usuario; sin una paleta nueva, ningún otro cambio se percibe como una mejora real.

**Independent Test**: Se puede validar navegando las cinco pantallas y verificando que usan la misma paleta (colores primarios, de acento, de estado) definida en un sistema de diseño único, sin colores sueltos por componente.

**Acceptance Scenarios**:

1. **Given** el usuario abre cualquier pantalla de la app, **When** observa los componentes (botones, tarjetas, gráficos, estados), **Then** todos usan colores provenientes de la misma paleta definida centralmente.
2. **Given** el usuario cambia entre modo claro y oscuro (si el sistema lo soporta), **When** la paleta se aplica, **Then** el contraste y la jerarquía visual se mantienen legibles en ambos modos.

---

### User Story 2 - Navegación y desplazamiento fluido entre secciones (Priority: P1.5)

Como usuario, quiero moverme entre inicio, registro, calendario y estadísticas de forma clara y fluida (scroll dentro de cada página y transición entre páginas), para no perder contexto ni sentir que la navegación es abrupta.

**Why this priority**: El feedback señala explícitamente el desplazamiento como un eje débil; una navegación confusa afecta el uso diario de la app, que es de uso recurrente (registro y consulta frecuentes). Depende de que US1 (paleta e identidad visual) esté aplicada primero: los componentes de navegación se rediseñan sobre la paleta y el sistema de diseño ya definidos, no antes.

**Independent Test**: Se puede probar navegando entre las cuatro secciones y haciendo scroll dentro de páginas con contenido largo (calendario, estadísticas), verificando que la posición de navegación y el punto de scroll se comportan de forma predecible.

**Acceptance Scenarios**:

1. **Given** el usuario está en una sección con contenido largo, **When** hace scroll, **Then** la navegación principal permanece accesible (fija o de fácil retorno) sin que el usuario pierda la referencia de en qué sección está.
2. **Given** el usuario cambia de sección, **When** la nueva página carga, **Then** la transición comunica visualmente el cambio de contexto sin bloquear la interacción por más de el tiempo de una transición estándar.

---

### User Story 3 - Animaciones con propósito (Priority: P2)

Como usuario, quiero que las interacciones clave (guardar un registro, abrir el calendario, ver un gráfico de estadísticas) tengan animaciones sutiles que confirmen la acción y guíen la atención, en lugar de las transiciones CSS mínimas actuales de shadcn, para que la app se sienta más pulida y receptiva.

**Why this priority**: Mejora percibida de calidad, pero depende de que la paleta y la navegación (P1) ya estén resueltas; animar sobre una base visual débil no resuelve el problema principal.

**Independent Test**: Se puede probar disparando acciones clave (guardar, filtrar, cambiar de mes en el calendario) y verificando que cada una tiene una animación de confirmación o transición perceptible y consistente con el resto de la app.

**Acceptance Scenarios**:

1. **Given** el usuario completa una acción de guardado en Registro, **When** la acción se confirma, **Then** una animación breve comunica éxito antes o junto con cualquier mensaje de confirmación.
2. **Given** el usuario interactúa con un gráfico en Estadísticas, **When** los datos cambian (por filtro o rango de fechas), **Then** la transición entre estados del gráfico es animada en vez de un salto instantáneo.

---

### User Story 4 - Contenido y formato rediseñados por página (Priority: P2)

Como usuario, quiero que el contenido de cada página (registro, calendario, estadísticas) esté organizado y jerarquizado visualmente de forma clara, con el formato de datos adecuado a cada uno, para encontrar y entender la información sin esfuerzo.

**Why this priority**: Depende de la paleta y el sistema de diseño (P1) para tener sentido; es la aplicación concreta del rediseño a cada pantalla existente, sin agregar funcionalidad nueva.

**Independent Test**: Se puede probar revisando cada una de las tres páginas funcionales y verificando que la jerarquía visual (qué se destaca primero, qué es secundario) refleja la importancia real de cada dato para el usuario.

**Acceptance Scenarios**:

1. **Given** el usuario entra a Calendario, **When** visualiza los datos del mes, **Then** los eventos o registros importantes son visualmente prioritarios frente a la grilla base.
2. **Given** el usuario entra a Estadísticas, **When** visualiza los gráficos, **Then** el dato o tendencia más relevante se percibe antes que el detalle secundario.
3. **Given** el usuario carga un dato (horas dormidas, caminata o peso) en Registro, **When** el valor se guarda, **Then** el stat correspondiente se muestra debajo del input, dentro de la misma card, sin necesidad de navegar a otra sección.
4. **Given** el usuario quiere ver la evolución histórica o gráficos de una métrica, **When** entra a Estadísticas, **Then** encuentra esa vista intacta, sin que el nuevo tratamiento en las cards de Registro la reemplace o duplique su función.

---

### User Story 5 - Plan de comidas / Nutrición (Priority: P2)

Como usuario, quiero una página "Nutrición" con el plan de comidas por día (desayuno, colación, almuerzo, merienda, cena), con rotación semanal para no repetir siempre lo mismo, tal como existía en la versión anterior de la app (`plan_vida_2026.html`) pero que nunca se migró a Next.js, para saber qué comer cada día sin tener que abrir el archivo viejo.

**Why this priority**: Es contenido que ya existía y se perdió en la migración 001 (nunca quedó documentado como decisión intencional); el menú lateral de esta etapa reserva explícitamente una sección "Nutrición" (US2) que necesita una página real detrás. No bloquea el resto del rediseño visual, pero completa el alcance que el usuario espera de esta sección del menú.

**Independent Test**: Se puede probar entrando a `/nutricion`, revisando que muestra las 4 comidas del día actual (o del día seleccionado) con nombre, detalle e ingredientes, que cambia según el día de la semana, y que las reglas fijas (plato chico/playo, vaso de agua, creatina) están visibles.

**Acceptance Scenarios**:

1. **Given** el usuario entra a Nutrición un día de semana (lunes a viernes), **When** la página carga, **Then** ve las 4 comidas de ese día (desayuno, colación/media mañana, almuerzo, merienda, cena — según el banco de comidas portado) con nombre y detalle de cada una.
2. **Given** el usuario navega a distintos días o semanas, **When** revisa el contenido, **Then** las comidas rotan según la misma lógica de rotación que tenía `plan_vida_2026.html` (no se repite el mismo plato en turnos consecutivos dentro del ciclo de rotación).
3. **Given** el usuario entra un sábado o domingo, **When** ve la página, **Then** se indica que esos días no tienen estructura fija de comidas (salvo evento), igual que en la versión anterior.

---

### User Story 6 - Navegación completa del plan por semanas y marca de eventos (Priority: P2)

Como usuario, quiero poder ver y saltar directamente a cualquier semana del plan (desde el 17 de agosto hasta el 31 de diciembre de 2026) tanto en Calendario como en Nutrición, agrupadas por mes en vez de una tira larga con todas las semanas, y que las semanas de evento (10K, Media Maratón de Luján, 21K) y sus semanas de preparación previa se distingan visualmente del resto — tal como existía en la versión anterior de la app, pero sin migrar a Next.js.

**Why this priority**: Es otro contenido/comportamiento que existía en `plan_vida_2026.html` (pestañas "Sem 1"..."Sem N" con colores de fase/evento) y se perdió en la migración 001 sin quedar documentado como decisión; hoy Calendario solo tiene "semana anterior/siguiente" de a una, sin salto directo ni marca de eventos. Depende de la paleta (P1) y comparte el mismo patrón de UI entre Calendario y Nutrición (US5).

**Independent Test**: Se puede probar entrando a Calendario, abriendo el selector de mes, eligiendo un mes y viendo solo las semanas de ese mes; repitiendo lo mismo en Nutrición; y verificando que las semanas de evento/preparación tienen una marca visual distinta a una semana regular.

**Acceptance Scenarios**:

1. **Given** el usuario está en Calendario, **When** abre el selector de mes, **Then** ve los meses del plan (agosto a diciembre de 2026) y, al elegir uno, solo las semanas de ese mes quedan visibles para seleccionar.
2. **Given** el usuario selecciona una semana específica dentro de un mes, **When** la elige, **Then** ve el contenido de esa semana directamente, sin tener que recorrer semana por semana desde la actual.
3. **Given** una semana coincide con un evento (10K, Luján, 21K) o es la semana previa de preparación a uno de esos eventos, **When** aparece listada en el selector, **Then** se distingue visualmente (marca o color) de una semana regular, igual que en la versión anterior de la app.
4. **Given** el mismo patrón de selector de mes/semana existe en Nutrición, **When** el usuario navega ahí, **Then** el comportamiento y el lenguaje visual del selector son los mismos que en Calendario.

---

### User Story 7 - Metadata técnica y SEO básico (Priority: P3)

Como usuario (y como responsable técnico de la app), quiero que la app tenga los elementos básicos de metadata técnica (página 404 propia, meta descriptions, sitemap, favicon, títulos descriptivos, año de copyright dinámico) para que se vea completa y profesional más allá de las pantallas principales.

**Why this priority**: No afecta la experiencia central de uso diario (registro/calendario/estadísticas); es un pulido complementario que se resuelve una vez que la identidad visual (P1/P1.5) y el contenido de las páginas (P2) ya están definidos.

**Independent Test**: Se puede probar navegando a una URL inexistente (ver página 404 propia), inspeccionando el `<head>` de cada página (meta description única, título descriptivo, favicon) y accediendo a `/sitemap.xml`.

**Acceptance Scenarios**:

1. **Given** el usuario navega a una URL que no existe, **When** la página carga, **Then** ve una página 404 con el mismo lenguaje visual del resto de la app, no la página 404 genérica de Next.js.
2. **Given** el usuario o un motor de búsqueda inspecciona cualquier página de la app, **When** revisa el `<head>`, **Then** encuentra un título descriptivo y una meta description propia de esa página, distinta a la de las demás.
3. **Given** el usuario mira el footer de la app, **When** lee el año de copyright, **Then** corresponde al año actual sin necesidad de actualizarlo a mano cada año.

---

### Edge Cases

- ¿Qué pasa si el usuario tiene activada una preferencia de sistema de "reducir movimiento" (`prefers-reduced-motion`)? Las animaciones deben reducirse o eliminarse respetando esa preferencia.
- ¿Cómo se comporta la navegación y el scroll en pantallas angostas (mobile) donde el espacio para navegación fija es limitado?
- ¿Qué pasa si Calendario o Estadísticas no tienen datos cargados todavía (usuario nuevo)? El formato visual debe contemplar un estado vacío coherente con la nueva identidad, no solo el estado con datos.
- ¿Cómo se ve la paleta nueva sobre estados de error o advertencia (ej. fallo al guardar un registro), que deben seguir siendo distinguibles del resto de la UI?
- ¿Cómo se comporta la navegación nueva (fija o de fácil retorno) respecto a SC-004 de la etapa 001 (sin scroll horizontal ni elementos cortados desde 360px hasta 1920px)? La navegación rediseñada no debe introducir scroll horizontal ni elementos cortados en ningún ancho de esa franja.
- ¿Qué pasa si el usuario entra a Nutrición sin haber elegido un día específico? Debe mostrarse por defecto el día actual según la fecha del sistema.
- ¿Qué pasa si el usuario entra al selector de mes/semana sin elegir nada? Debe mostrarse por defecto el mes y la semana actuales según la fecha del sistema.
- ¿Qué pasa si el usuario intenta navegar a una semana anterior al 17 de agosto de 2026 o posterior al 31 de diciembre de 2026? No debe ser posible seleccionar meses/semanas fuera de ese rango, ya que el plan no tiene contenido definido fuera de él.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST definir una paleta de colores completa (primarios, acento, neutros, estados de éxito/error/advertencia) aplicada de forma consistente en las cinco pantallas de la app (inicio, registro, calendario, estadísticas, nutrición).
- **FR-002**: El sistema MUST reemplazar la paleta verde-azulada actual en todos los componentes visuales, sin dejar colores de la paleta anterior mezclados con la nueva.
- **FR-003**: La navegación entre secciones MUST comunicar en todo momento en qué sección se encuentra el usuario (indicador de sección activa).
- **FR-004**: El desplazamiento (scroll) dentro de páginas con contenido extenso MUST mantener accesible la navegación principal sin requerir que el usuario vuelva al inicio de la página.
- **FR-005**: Las transiciones entre secciones y los cambios de estado de datos (guardar, filtrar, cambiar rango) MUST tener una animación perceptible que comunique el cambio, salvo que el usuario tenga activada la preferencia de sistema `prefers-reduced-motion`, en cuyo caso MUST reducirse o eliminarse.
- **FR-006**: Cada una de las tres páginas funcionales (registro, calendario, estadísticas) MUST tener su contenido reorganizado con una jerarquía visual explícita (qué se destaca primero) definida como parte de esta etapa, no heredada sin revisión de la etapa anterior.
- **FR-007**: El rediseño MUST implementarse mediante el skill `ui-ux-pro-max` en su modalidad de sistema de diseño completo (paleta, tipografía, tokens, componentes, motion), en línea con el Principio III de la constitución del proyecto.
- **FR-008**: El rediseño MUST preservar toda la funcionalidad existente (registro de datos, visualización de calendario, visualización de estadísticas) sin alterar el esquema de Supabase ni la lógica de negocio, en línea con el Principio IV de la constitución.
- **FR-009**: Los estados vacíos (sin datos aún) de calendario y estadísticas MUST tener un tratamiento visual acorde a la nueva identidad, en vez de quedar sin diseñar.
- **FR-010**: Todos los componentes de navegación nuevos MUST preservar la restricción SC-004 de la etapa 001-nextjs-migration: sin scroll horizontal ni elementos cortados en anchos de pantalla desde 360px hasta 1920px.
- **FR-011**: Cada stat de registro (horas dormidas, caminata, peso) MUST mostrarse debajo de su input correspondiente, dentro de la misma card de registro donde se ingresa ese dato, en lugar de agruparse en una sección aparte; la página Estadísticas se mantiene sin cambios de alcance como vista de tendencias históricas y gráficos, y no es reemplazada por este tratamiento en las cards de registro.
- **FR-012**: El sistema MUST tener una página 404 personalizada, alineada al lenguaje visual del resto de la app, en lugar de la página 404 genérica del framework.
- **FR-013**: Cada página MUST tener una meta description única y MUST existir un `sitemap.xml` que liste las páginas de la app.
- **FR-014**: El sistema MUST tener favicon propio, títulos de página (`<title>`) descriptivos por página, y un año de copyright en el footer calculado dinámicamente (no hardcodeado).
- **FR-015**: MUST existir una página `/nutricion` que muestre el plan de comidas por día (desayuno, colación, almuerzo, merienda, cena), portado desde el banco de comidas y la lógica de rotación de `plan_vida_2026.html` (la versión previa a la migración a Next.js).
- **FR-016**: El contenido del plan de comidas (banco de comidas, reglas de rotación, reglas fijas de método del plato) MUST vivir como datos estáticos en el código de la aplicación, de la misma forma que el plan de gimnasio (`lib/training-plan.ts`), sin persistirse ni modelarse en Supabase — no requiere ningún cambio de esquema ni la aprobación explícita del Principio IV.
- **FR-017**: La página de Nutrición MUST mostrar las reglas fijas ya definidas en la versión anterior (plato chico para desayuno/merienda, plato playo de 28cm con medio plato de vegetales para almuerzo/cena, vaso de agua antes de cada comida, creatina diaria) y MUST indicar que sábado y domingo no tienen estructura fija salvo día de evento.
- **FR-018**: La rotación semanal de comidas MUST preservar la regla de no repetir el mismo plato en turnos consecutivos dentro del ciclo de rotación, igual que en la lógica portada de `plan_vida_2026.html`. La rotación MUST ser determinística (misma semilla, mismo resultado siempre) — no se agrega una función de regenerar/rebarajar el plan; al ser determinística, ninguna semana (actual ni futura) cambia con el paso del tiempo, lo cual ya garantiza que la semana en curso no se altera.
- **FR-019**: Calendario y Nutrición MUST permitir seleccionar directamente cualquier semana del plan (17 de agosto al 31 de diciembre de 2026), no solo navegar de a una semana con "anterior/siguiente".
- **FR-020**: La selección de semana MUST agruparse por mes (elegir un mes primero, y dentro de ese mes elegir la semana) en vez de mostrar la lista completa de todas las semanas del plan a la vez.
- **FR-021**: Las semanas que coinciden con un evento (10K, Media Maratón de Luján, 21K) o son la semana de preparación previa a uno de esos eventos MUST distinguirse visualmente de una semana regular en el selector, portando la información de fases/eventos ya presente en `lib/training-plan.ts` (hoy calculada mas no expuesta a la UI).

### Key Entities

- **Sistema de diseño (design tokens)**: paleta de colores, escalas tipográficas, espaciados y parámetros de motion que se aplican de forma centralizada a todas las páginas; no introduce datos de negocio nuevos.
- **Páginas de la app**: inicio, registro, calendario, estadísticas, nutrición — cada una consume el sistema de diseño; registro/calendario/estadísticas mantienen sus datos y lógica actuales sin cambios de esquema, y nutrición se agrega como página nueva de contenido estático (sin dato nuevo en Supabase).
- **Plan de comidas (meal bank)**: conjunto de opciones de comida agrupadas por tipo (desayuno, colación/media mañana, almuerzo, merienda, cena), cada una con nombre, detalle e ingredientes con cantidad; se selecciona por día mediante una rotación determinística, análoga a `Session` en el plan de gimnasio (`lib/training-plan.ts`). No es dato de usuario ni se guarda en Supabase.
- **Semana del plan**: número de semana, fecha de inicio/fin, fase de entrenamiento y si coincide con un evento o su semana de preparación previa; ya existe como estructura interna en `lib/training-plan.ts` (no exportada hoy) y se reutiliza como base tanto para el selector de Calendario como el de Nutrición. No es dato de Supabase.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede identificar en qué sección de la app se encuentra en menos de 2 segundos de mirar la pantalla, sin necesidad de leer texto.
- **SC-002**: El 100% de los componentes visuales de las cinco pantallas usan colores de la paleta única definida en esta etapa (cero colores sueltos fuera del sistema de diseño).
- **SC-003**: Las acciones clave (guardar registro, cambiar mes en calendario, filtrar estadísticas) muestran una respuesta animada perceptible en menos de 300ms desde la interacción del usuario.
- **SC-004**: El usuario valora el resultado visual como una mejora clara frente a la versión anterior en una revisión posterior a la implementación (validación cualitativa directa con el usuario, dado que es el único usuario final del producto).
- **SC-005**: La app respeta la preferencia de sistema `prefers-reduced-motion` en el 100% de las animaciones agregadas en esta etapa.
- **SC-006**: El usuario puede ver el plan de comidas del día actual en menos de 2 pasos de navegación desde cualquier pantalla (por ejemplo, un clic en el menú lateral).

## Assumptions

- El usuario objetivo es Brian mismo (uso personal), por lo que la validación de "satisfacción del usuario" (SC-004) es una revisión directa con él, no una métrica de producto a escala.
- No se requiere soporte de internacionalización ni de múltiples marcas; se define una única paleta e identidad.
- El modo oscuro se trata como parte del sistema de diseño si `ui-ux-pro-max --design-system` lo genera por defecto, pero no es un requisito separado si el usuario no lo pide explícitamente al ejecutar ese comando.
- Las cuatro páginas funcionales existentes al cierre de la etapa 001 (registro, calendario, estadísticas, inicio) se mantienen sin cambio de alcance de negocio; la única página de contenido nueva de esta etapa es Nutrición (`/nutricion`, FR-015), que no es funcionalidad nueva sino contenido que existía en `plan_vida_2026.html` y nunca se migró en 001. La página 404 (FR-012) y el `sitemap.xml` (FR-013) son artefactos técnicos complementarios, no páginas de producto.
- El plan de comidas se porta como datos estáticos en código, igual que el plan de gimnasio; no se persiste en Supabase, por lo que no dispara el requisito de aprobación explícita del Principio IV (sin cambio de esquema).
- Los dials de `ui-ux-pro-max --design-system` (`--variance`, `--motion`, `--density`) se eligen durante la etapa de planificación/implementación (`/speckit-plan`), no en esta especificación, ya que son parámetros de ejecución del skill y no requisitos de negocio.
