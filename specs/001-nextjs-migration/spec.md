# Feature Specification: Migración a Next.js con Diseño Renovado

**Feature Branch**: `001-nextjs-migration`

**Created**: 2026-08-30

**Status**: Draft

**Input**: User description: "reconstruir la app como Next.js + TypeScript, conectada al mismo proyecto y schema de Supabase, con mejor diseño visual, preservando las funcionalidades relevadas: registro de ejercicio (running, caminata, gym), registro de dieta/salud (calorías, peso, sueño, objetivo calórico), calendario de días completados, alertas de racha de gym y de ritmo de running, y CRUD genérico de registros sobre la misma tabla/schema existente. Es la primera etapa de una serie de cambios; habrá nuevos requerimientos después."

## Clarifications

### Session 2026-08-30

- Q: ¿La app reconstruida va a quedar accesible en una URL pública de internet, o vas a mantenerla en un entorno privado/local (sin URL pública)? → A: Se mantiene privada/de uso local por ahora — no se agrega autenticación en esta etapa.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar actividad y salud diaria sin perder datos históricos (Priority: P1)

Como usuario que ya usa la app día a día, quiero seguir registrando mis tiradas de running,
caminatas, calorías, peso y horas de sueño en la app reconstruida, y que todo lo que ya cargué
antes siga apareciendo, para no perder continuidad en mi seguimiento.

**Why this priority**: Es el uso diario central de la app. Si un solo tipo de registro se pierde,
se corrompe o deja de guardarse correctamente, la migración falla sin importar qué tan bien se
vea la interfaz nueva.

**Independent Test**: Se puede probar completamente cargando un registro de cada tipo (tirada,
caminata, calorías, peso, sueño) en la app nueva y verificando que aparece igual que en la app
actual, y que los registros previos cargados desde la app vieja siguen visibles sin cambios.

**Acceptance Scenarios**:

1. **Given** la app reconstruida conectada a la base existente, **When** el usuario carga una
   tirada de running con distancia y tiempo, **Then** el registro se guarda y el ritmo (pace) se
   calcula y muestra igual que en la versión actual.
2. **Given** registros históricos ya cargados por la app anterior, **When** el usuario abre la app
   reconstruida, **Then** esos registros aparecen listados sin pérdida ni alteración de datos.
3. **Given** un registro cargado por error, **When** el usuario lo borra, **Then** desaparece de
   inmediato de todas las vistas que lo mostraban (listados, calendario, estadísticas).
4. **Given** el usuario carga su peso más reciente, **When** consulta su objetivo calórico,
   **Then** el sistema lo calcula usando ese último peso registrado, igual que antes.

---

### User Story 2 - Ver progreso, rachas y alertas de forma clara (Priority: P2)

Como usuario, quiero ver marcado en un calendario qué días completé mi plan, y recibir el mismo
tipo de aviso que antes cuando pierdo racha de gimnasio o cuando mi ritmo de running no mejora,
para poder corregir a tiempo.

**Why this priority**: Es el valor de seguimiento/motivación de la app, pero depende de que el
registro base (User Story 1) ya funcione correctamente.

**Independent Test**: Se puede probar marcando y desmarcando días como completados y verificando
que el calendario refleja el cambio al instante, y forzando las condiciones de alerta (3+ faltas
seguidas a sesiones de gym programadas, o ritmo de running sin mejora en las últimas dos tiradas
de sábado) para confirmar que el aviso aparece igual que en la app actual.

**Acceptance Scenarios**:

1. **Given** un día marcado como "gym" en el calendario semanal, **When** el usuario lo marca como
   completado, **Then** el día se pinta como completado y queda disponible para el cálculo de
   racha.
2. **Given** tres o más sesiones de gym programadas seguidas sin marcar como completadas,
   **When** el usuario revisa sus estadísticas, **Then** ve la alerta de racha de gimnasio perdida.
3. **Given** las últimas dos tiradas de sábado con ritmo igual o peor al objetivo, **When** el
   usuario revisa sus estadísticas, **Then** ve la alerta de ritmo de running no mejorado.

---

### User Story 3 - Usar la app con un diseño visual renovado (Priority: P3)

Como usuario, quiero que la app reconstruida se vea y se sienta más cuidada visualmente que la
versión HTML actual, manteniendo la misma información y acciones, para que sea más agradable de
usar a diario.

**Why this priority**: Es la mejora explícitamente pedida además de la migración técnica, pero no
bloquea el uso funcional de la app — puede iterarse después de que P1 y P2 estén sólidos.

**Independent Test**: Se puede probar recorriendo cada pantalla existente (registro, calendario,
estadísticas) en la app reconstruida y confirmando que toda acción disponible en la versión
actual sigue disponible, con una presentación visual coherente y legible en escritorio y celular.

**Acceptance Scenarios**:

1. **Given** cualquier pantalla de la app actual, **When** se abre su equivalente en la app
   reconstruida, **Then** todas las acciones y datos presentes en el original siguen accesibles.
2. **Given** la app reconstruida abierta en un celular, **When** el usuario navega entre secciones
   (registro, calendario, estadísticas), **Then** el contenido se adapta al ancho de pantalla sin
   scroll horizontal ni elementos cortados.

---

### Edge Cases

- ¿Qué pasa si Supabase no responde o hay un corte de conexión durante un guardado o borrado? El
  usuario debe recibir un aviso claro (igual que hoy) y el dato no debe darse por guardado hasta
  confirmarse.
- ¿Qué pasa si un registro histórico tiene una `categoria` o formato de `nota` que la app actual
  nunca generó (dato cargado manualmente en Supabase)? La app reconstruida debe mostrarlo sin
  romperse, aunque no lo reconozca en cálculos de racha/alerta.
- ¿Qué pasa si el usuario intenta marcar como completado un día futuro? Debe seguir bloqueado,
  igual que en la app actual.
- ¿Qué pasa si dos pestañas/dispositivos editan al mismo tiempo? No se requiere resolución de
  conflictos especial para esta etapa: gana el último guardado, igual que el comportamiento actual.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir registrar tiradas de running con distancia y tiempo, y
  calcular y mostrar el ritmo (pace) resultante, igual que la app actual.
- **FR-002**: El sistema MUST permitir registrar caminatas con distancia en kilómetros.
- **FR-003**: El sistema MUST permitir registrar calorías diarias, peso corporal y horas de sueño.
- **FR-004**: El sistema MUST calcular el objetivo calórico diario usando el peso más reciente
  registrado, con la misma fórmula (Mifflin-St Jeor) que usa la app actual.
- **FR-005**: El sistema MUST permitir marcar y desmarcar un día del calendario semanal como
  completado, y reflejar ese estado visualmente de inmediato.
- **FR-006**: El sistema MUST detectar y mostrar una alerta cuando se pierden 3 o más sesiones de
  gimnasio programadas seguidas sin completar.
- **FR-007**: El sistema MUST detectar y mostrar una alerta cuando el ritmo de running de las
  últimas dos tiradas de sábado no mejora respecto al objetivo definido.
- **FR-008**: El sistema MUST permitir borrar cualquier registro de ejercicio o salud cargado
  (tirada, caminata, calorías, peso, sueño) desde su listado, reflejando el borrado de inmediato
  en todas las vistas relacionadas (listados, calendario, estadísticas). Los días marcados como
  completados se borran desmarcándolos desde el calendario (ver FR-005), no desde este listado.
- **FR-009**: El sistema MUST leer y escribir sobre el mismo proyecto y schema de Supabase que usa
  la app actual, sin crear tablas nuevas ni modificar columnas existentes.
- **FR-010**: El sistema MUST mostrar sin pérdida los registros históricos ya cargados por la app
  actual, incluidos los marcados como día completado.
- **FR-011**: El sistema MUST presentar todas las pantallas (registro, calendario, estadísticas)
  con una interfaz visual renovada, manteniendo el mismo conjunto de acciones e información
  disponible hoy.
- **FR-012**: El sistema MUST funcionar correctamente en pantallas de escritorio y de celular.

### Key Entities

- **Registro**: un evento cargado por el usuario (tirada, caminata, calorías, peso, sueño, o día
  completado), identificado por categoría, fecha, un valor numérico y una nota opcional. Es la
  única entidad de datos de esta etapa; su forma y su tabla en Supabase no cambian.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El usuario puede cargar cualquiera de los cinco tipos de registro (tirada, caminata,
  calorías, peso, sueño) en menos de 15 segundos desde que abre la app.
- **SC-002**: El 100% de los registros históricos existentes en Supabase se visualizan
  correctamente en la app reconstruida, sin pérdida ni duplicación de datos.
- **SC-003**: Las alertas de racha de gimnasio y de ritmo de running aparecen en el 100% de los
  casos en que se cumplen las mismas condiciones que en la app actual.
- **SC-004**: La app se usa sin scroll horizontal ni elementos cortados en anchos de pantalla desde
  360px (celular chico) hasta 1920px (escritorio).
- **SC-005**: Ningún dato se pierde ni queda en estado ambiguo cuando se corta la conexión durante
  un guardado o borrado: el usuario siempre recibe confirmación clara de éxito o error.

## Assumptions

- El proyecto y las credenciales de Supabase existentes se reutilizan tal cual; no se crea un
  proyecto nuevo ni se modifica el schema de la tabla `registro` en esta etapa.
- "Mejor diseño visual" se interpreta como una renovación de la interfaz siguiendo las
  convenciones ya adoptadas por el proyecto (ui-ux-pro-max), sin agregar funcionalidades nuevas
  fuera de las relevadas del HTML actual.
- Esta es la primera etapa de una serie de cambios: el alcance de esta specification se limita a
  paridad funcional + renovación visual + migración técnica. Cualquier funcionalidad nueva
  (más allá de lo que ya existe hoy) queda fuera de esta etapa y se define en especificaciones
  futuras.
- No se requiere autenticación multiusuario nueva ni cambios de permisos; se asume el mismo modelo
  de acceso de un único usuario que tiene la app actual.
- La app se mantiene en un entorno privado/de uso local por ahora, sin URL pública de internet;
  por eso no se agrega ningún control de acceso (login, contraseña) en esta etapa. Si en una etapa
  futura se decide exponerla públicamente, esa decisión debe volver a evaluarse junto con un
  mecanismo de autenticación antes del despliegue.
- No se requiere migración ni exportación de datos: los datos ya viven en Supabase y la app nueva
  simplemente se conecta al mismo proyecto.
