# Plan de Vida 2026

App personal para organizar entrenamiento, comidas y seguimiento de objetivos a lo largo de 2026: un 10K, la Procesión a Luján (80km) y una media maratón (21K).

## Qué es

Un plan de vida hecho app: en vez de una planilla o un PDF estático, el entrenamiento y las comidas viven como una web personal que se actualiza según la fecha y la fase en la que se está (construcción, preparación para un evento, recuperación, tapering).

## Secciones

- **Plan de gimnasio** — calendario semanal con el entrenamiento, dividido en fases que rotan automáticamente según la fecha (velocidad, resistencia, recuperación, construcción para el 21K, tapering, mantenimiento).
- **Mancuernas** — rutinas cortas de mancuernas por grupo muscular para pausas de Pomodoro en casa, para los días que no dan para ir al gym.
- **Nutrición** — plan de comidas rotativo con objetivo de proteína diario, ajustado según la fase de entrenamiento (menos déficit calórico y más carbohidratos antes de los eventos largos).
- **Stats** — seguimiento de tiradas, ritmo y resultados de los eventos.

## Cómo está pensada

El plan de entrenamiento y de comidas vive hardcodeado en el código, no en una base de datos: son decisiones tomadas de antemano, no datos que cambien solos. Lo único que se registra día a día (peso, calorías, tiradas, sueño, resultados de eventos) es lo que sí necesita persistirse.

Stack: Next.js + React + TypeScript, con Supabase para lo que el usuario va registrando.
