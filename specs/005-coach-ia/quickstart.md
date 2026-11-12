# Quickstart: Coach IA

Validación manual (no hay test suite).

## 1. Setup

1. Crear la API key en https://aistudio.google.com/apikey, en un proyecto de Google
   Cloud **sin facturación activada**. Esto es lo que garantiza el costo $0.
2. Cargar `GEMINI_API_KEY=...` en `.env.local` y en Netlify
   (`netlify env:set GEMINI_API_KEY ...`). No se commitea.
3. Aplicar `supabase/migrations/20261112120000_coach_ia.sql` en Supabase.
4. Correr `npm test` (antes `scripts/check-meal-scaling.mjs`, hoy `lib/meal-plan.test.ts`). Tiene que pasar.
5. Correr `npm run dev`.

## 2. Nutrición (porciones y proteína)

- **Sin peso registrado**: las comidas son idénticas a las de antes y no aparece
  "Porción para tu meta".
- **Con peso registrado**:
  - Aparece "Porción para tu meta" con los gramos escalados.
  - "Plan: ~X kcal" queda cerca de la meta, salvo que el factor tope en ×0.75 o ×1.3.
  - Al cambiar a una semana de otra fase, las porciones cambian.
- **Con peso 94.9**: el refuerzo de proteína se dispara en los mismos casos que antes,
  según la proteína del almuerzo escalado.

## 3. Coach

1. Preguntar "¿qué me toca esta semana?". La respuesta tiene que usar las sesiones
   reales y el contador tiene que bajar 1.
2. **Agregar al plan** con "tengo lentejas, atún y batata":
   - En Supabase, `plan_ia.contenido` conserva los platos anteriores más los nuevos.
   - Los platos nuevos van apareciendo en Nutrición.
3. **Armar plan nuevo**: el banco se reemplaza. **Volver al plan base** borra la fila.
4. **Armar rutinas**: en Calendario, los días de gym muestran los ejercicios nuevos.
   **Volver a las rutinas base** restaura las de antes.
5. Cargar un evento nuevo después de generar el plan. Coach tiene que avisar que el
   plan quedó desactualizado.

## 4. Límites y seguridad

1. En SQL, `update uso_ia set usos = 20 where ...`. El próximo mensaje tiene que dar
   "Usaste tus 20 consultas de hoy".
2. Desde la consola del navegador, con la anon key,
   `supabase.from('uso_ia').update({usos:0})` no tiene que afectar filas (RLS solo
   permite SELECT).
3. Mandar 6 mensajes en menos de un minuto. El sexto tiene que dar "Vas muy rápido".
4. Sin `GEMINI_API_KEY`, Coach muestra "La IA no está configurada todavía" y el resto de
   la app anda normal.
5. `/mancuernas` tiene que dar 404 y la nav tiene que mostrar Calendario, Nutrición,
   Estadísticas y Coach.
