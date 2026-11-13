# Bakata

[![CI](https://github.com/brian-pitz-dev/proyecto-integrador/actions/workflows/ci.yml/badge.svg)](https://github.com/brian-pitz-dev/proyecto-integrador/actions/workflows/ci.yml)

**Demo:** https://bakata.netlify.app

App para organizar entrenamiento, comidas y seguimiento de objetivos propios: cada
usuario se registra, carga su perfil y sus propios eventos (carreras o caminatas), y
a partir de eso se arma su plan de gimnasio, nutrición y calorías.

## Qué es

Un plan de vida hecho app: en vez de una planilla o un PDF estático, el
entrenamiento y las comidas viven como una web que se actualiza según la fecha y la
fase de entrenamiento en la que está cada usuario (construcción, preparación para un
evento, recuperación, tapering), calculada en relación a sus propios eventos — no a
un calendario fijo.

Arrancó como un proyecto personal de un solo usuario (fechas y eventos
hardcodeados), y se generalizó a multi-usuario: cualquiera puede crear una cuenta.

## Secciones

- **Plan de gimnasio** — calendario semanal con el entrenamiento, dividido en fases
  que rotan automáticamente según la fecha y los eventos propios de cada usuario
  (velocidad, resistencia, recuperación, construcción para una carrera larga,
  tapering, mantenimiento).
- **Nutrición** — plan de comidas rotativo con porciones escaladas a la meta calórica
  del día y objetivo de proteína según tu peso, ajustado según la fase de entrenamiento (menos déficit calórico y más carbohidratos antes de
  los eventos largos).
- **Estadísticas** — seguimiento de tiradas, ritmo y resultados de los eventos.
- **Coach** — chat con IA (Google Gemini, tier gratis, 20 consultas por día por usuario)
  que conoce tu plan, y que además arma un plan de comidas a partir de lo que tenés o
  querés comer y rutinas de gym según tus eventos, metas y equipo.

## Cómo está pensada

La metodología de entrenamiento (las 6 fases y su contenido semana a semana) y el
banco de comidas/ejercicios viven hardcodeados en el código, compartidos por todos
los usuarios — son decisiones tomadas de antemano, no datos que cambien solos. Lo que
sí es dato de cada usuario: su perfil (edad, altura, peso, objetivo) y sus eventos
propios, que determinan qué fechas ocupa cada fase — y lo que se registra día a día
(peso, calorías, tiradas, sueño, resultados de eventos).

Stack: Next.js + React + TypeScript, con Supabase para auth y para todo lo que cada
usuario va registrando/configurando. Desplegado en Netlify.

## Correrlo localmente

Requisitos: Node 20.9+ y un proyecto de [Supabase](https://supabase.com) (el plan
gratis alcanza).

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear el esquema: correr en orden los archivos de `supabase/migrations/` en el SQL
   editor de Supabase, o con la CLI: `supabase link` y después `supabase db push --remote`.

3. Variables de entorno: copiar `.env.example` a `.env.local` y completarlo (Supabase,
   Cloudflare Turnstile y Google Gemini).

4. Levantar la app en http://localhost:3000:

   ```bash
   npm run dev
   ```

Otros comandos: `npm test` (tests de la lógica de `lib/`), `npm run lint`,
`npm run build`.

La historia de por qué cada parte está hecha como está vive en `specs/`: cada
carpeta tiene su `spec.md`, `plan.md` y `research.md`.
