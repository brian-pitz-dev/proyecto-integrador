# Implementation Plan: Coach IA

**Branch**: `main` | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)

## Summary

Suma una pestaña **Coach** (que reemplaza a Mancuernas) con tres partes:

- un chat que conoce el plan del usuario;
- la generación de un banco de comidas (agregar o reemplazar) y de las 7 rutinas de gym,
  que se guardan en `plan_ia` y reemplazan a las compartidas solo para ese usuario
  (cierra US4 de spec 004);
- el escalado de porciones a la meta calórica, con un umbral de proteína según el peso.

Gemini gratis, con un tope de 20 usos diarios por usuario. Las decisiones están en
[research.md](./research.md).

## Archivos

| Archivo                                                         | Qué hace                                                                                                 |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/20261112120000_coach_ia.sql`               | `plan_ia` (RLS owner-scoped), `uso_ia` (solo SELECT) y `consumir_uso_ia()`                               |
| `lib/ai.ts`                                                     | `generate()`: fetch a la Interactions API de Gemini, con errores amigables                               |
| `lib/coach.ts`                                                  | `AI_DAILY_LIMIT`, `describeUser()` (contexto del prompt) y los system prompts                            |
| `lib/validation/coach.ts`                                       | zod para el input del usuario, la salida de la IA y lo guardado; `toGeminiSchema()`                      |
| `app/(app)/coach/actions.ts`                                    | `chatCoach`, `generarPlanComidas`, `generarRutinas`, `borrarPlanIa`                                      |
| `app/(app)/coach/page.tsx`, `components/coach/coach-client.tsx` | UI                                                                                                       |
| `lib/meal-plan.ts`                                              | `getMealsForDay(..., { bank, metaKcal, pesoKg })`, `ingredienteNutri`, `umbralAlmuerzo`, `formatPortion` |
| `lib/user-plan.ts`                                              | carga `planIa` (re-validado) en `UserPlanContext`                                                        |
| `lib/calorie-target.ts`                                         | `CalorieTarget.pesoKg`                                                                                   |
| `components/nutrition/*`, `components/calendar-grid/*`          | consumen el banco o las rutinas del usuario                                                              |
| `lib/rate-limit.ts`                                             | `isCoachRateLimited`/`recordCoachAttempt` (5 por minuto)                                                 |
| `scripts/check-meal-scaling.mjs`                                | self-check del escalado                                                                                  |

Se eliminaron `app/(app)/mancuernas/` y `lib/dumbbell-exercises.ts`.

## Fuera de este corte

- Las rutinas de core siguen compartidas.
- No hay streaming ni historial persistido del chat.
- Los platos agregados no se fijan a un día concreto.
- No se edita plato por plato.
- El fin de semana sigue sin menú.
