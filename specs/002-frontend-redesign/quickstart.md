# Quickstart: Validación del Rediseño de Frontend (002-frontend-redesign)

## Prerrequisitos

- Repo en la branch/directorio `specs/002-frontend-redesign` con la implementación aplicada.
- `.env.local` con las credenciales de Supabase ya configuradas (sin cambios respecto a la etapa 001).
- Node y dependencias instaladas: `npm install` (no se agregan dependencias nuevas fuera de las ya listadas en `research.md` Decisión 3-5).

## Setup

```bash
npm run dev
```

Abrir `http://localhost:3000`.

## Escenarios de validación (uno por User Story del spec)

### 1. Paleta e identidad visual (US1, FR-001/002, SC-002)

1. Navegar por las 4 pantallas: `/`, `/registro`, `/calendario`, `/estadisticas`.
2. Confirmar visualmente que ningún componente usa el verde-azulado anterior (hue ~165 en `oklch`); inspeccionar `app/globals.css` y verificar que `--primary`/`--accent`/`--chart-*` fueron reemplazados.
3. Alternar modo oscuro/claro (toggle de `next-themes`) y confirmar contraste legible en ambos.
   - **Esperado**: paleta consistente en las 4 pantallas, sin colores sueltos fuera de los tokens de `globals.css`.

### 2. Navegación por sidebar (US2, FR-003/004/010, SC-001)

1. En desktop (≥1024px), confirmar el menú lateral con las 3 secciones (Plan de gimnasio, Nutrición, Stats) y que la sección activa se distingue visualmente en <2s de mirar la pantalla.
2. Reducir el viewport a 360px (DevTools) y confirmar el equivalente mobile (drawer) sin scroll horizontal ni elementos cortados, en todo el rango 360px–1920px.
3. Entrar a Calendario o Estadísticas (contenido largo), hacer scroll, y confirmar que el menú permanece accesible (fijo o de fácil retorno).
   - **Esperado**: mismo patrón de navegación en desktop y mobile, sección activa siempre visible, sin scroll horizontal en ningún ancho de la franja.

### 3. Animaciones (US3, FR-005, SC-003, SC-005)

1. Guardar un registro desde cualquiera de los modales por categoría y confirmar una animación de confirmación perceptible en <300ms, junto al toast de éxito/error (`sonner`).
2. Activar `prefers-reduced-motion` en el SO/navegador, repetir el paso 1, y confirmar que la animación se reduce o elimina.
   - **Esperado**: feedback animado en interacciones clave, respetando la preferencia de accesibilidad del sistema.

### 4. Contenido por página y modal de registro (US4, FR-006/009/011)

1. En Registro, confirmar que hay una card por categoría (tirada, caminata, calorías, peso, sueño) con su stat más reciente mostrado debajo del punto de entrada, y que tocar/clickear la card abre el modal correspondiente (sin selector de tipo dentro del modal).
2. Confirmar que Estadísticas sigue existiendo intacta como vista de tendencias/gráficos, sin duplicar ni ser reemplazada por las cards de Registro.
3. Con una cuenta sin datos cargados, confirmar que Calendario y Estadísticas muestran un estado vacío diseñado (no una pantalla en blanco o un error).
   - **Esperado**: jerarquía visual clara por página, dato reciente visible junto al punto de carga, Estadísticas sin cambios de alcance.

### 5. Plan de comidas / Nutrición (US5, FR-015/016/017/018, SC-006)

1. Entrar a `/nutricion` desde el ítem "Nutrición" del sidebar (≤2 clics desde cualquier pantalla).
2. Confirmar que muestra las comidas del día actual (desayuno, media mañana, almuerzo, merienda, cena) con nombre, detalle e ingredientes.
3. Cambiar de día/semana (si la UI lo permite) y confirmar que la rotación no repite el mismo plato en turnos consecutivos.
4. Confirmar que las reglas fijas (plato chico/playo, agua, creatina) están visibles, y que sábado/domingo se marcan sin estructura fija.
   - **Esperado**: contenido equivalente al de `page-nutri` en `plan_vida_2026.html`, sin escribir ni leer nada de Supabase para este contenido.

### 6. Selector de semanas por mes y marca de eventos (US6, FR-019/020/021)

1. En Calendario, abrir el selector de mes y confirmar que lista solo los meses del plan (agosto a diciembre 2026).
2. Elegir un mes y confirmar que solo aparecen las semanas de ese mes (no las ~20 semanas completas de una vez).
3. Seleccionar una semana que contenga el 10K, la Media Maratón de Luján o el 21K (o la semana inmediata anterior a cada uno) y confirmar que se distingue visualmente del resto.
4. Repetir los pasos 1-3 en Nutrición y confirmar el mismo comportamiento y lenguaje visual que en Calendario.
   - **Esperado**: mismo componente de selector reutilizado en ambas páginas, sin listar nunca más de un mes de semanas a la vez.

### 7. Metadata técnica (US7, FR-012/013/014)

1. Navegar a una URL inexistente (ej. `/no-existe`) y confirmar una página 404 con el lenguaje visual de la app.
2. Ver el código fuente (`view-source:`) de `/`, `/registro`, `/calendario`, `/estadisticas` y confirmar `<title>` y `<meta name="description">` distintos por página.
3. Acceder a `/sitemap.xml` y confirmar que lista las páginas de la app.
4. Confirmar favicon propio en la pestaña del navegador y que el año de copyright del footer coincide con el año actual del sistema.

## Criterio de aceptación general

Todos los escenarios anteriores pasan sin regresión funcional: los datos que ya se guardaban en Supabase (tirada/caminata/calorías/peso/sueño) se siguen guardando igual, sólo cambia dónde y cómo se presentan (Principio IV, FR-008).
