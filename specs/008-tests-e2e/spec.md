# Feature Specification: Tests end-to-end

**Feature**: `008-tests-e2e` | **Created**: 2026-11-13 | **Status**: Implementado; falta la cuenta de prueba (ver "Puesta en marcha")

**Input**: Hasta ahora la UI, las Server Actions y Supabase se validaban a mano con cada
`quickstart.md`. Los flujos clave pasan a tests de Playwright que corren en cada push.

## Qué cubren

- `e2e/navegacion.spec.ts`: con sesión cargan las cinco pestañas; sin sesión, una página privada
  manda al login.
- `e2e/registro.spec.ts`: cargar un peso desde Estadísticas y borrarlo.
- `e2e/fotos.spec.ts`: subir una foto con nota y % de grasa, editar la nota y borrarla.
- `e2e/exportar.spec.ts`: "Descargar mis datos" rechaza una contraseña mala y con la buena baja
  un JSON con perfil, eventos, registros y fotos.

## Decisiones

1. **Contra el Supabase real, con una cuenta propia de los tests** (`E2E_EMAIL` /
   `E2E_PASSWORD`). No hay Docker en la máquina de desarrollo para un Supabase local, y un
   segundo proyecto era más configuración. Todo lo que cargan los tests tiene fecha de 2020 y
   `e2e/global-setup.ts` lo borra al arrancar, por si una corrida anterior falló a la mitad.
   Nunca se usan las cuentas de Brian ni de Ana.
2. **Login sin el formulario.** Turnstile no deja pasar a un navegador automático en CI, así
   que `global-setup.ts` inicia sesión directo con Supabase usando `@supabase/ssr` (la misma
   librería que arma las cookies en la app) y Playwright arranca cada test con esas cookies. El
   formulario de login sigue validándose a mano.
3. **Un solo worker.** Los tests comparten la cuenta; en paralelo se pisarían los datos.
4. **El tutorial** se abre la primera vez y taparía la página: el setup marca
   `tutorial_visto` en la cuenta de prueba.
5. **CI**: job `e2e` en `.github/workflows/ci.yml`, después de lint/tests/build. Corre contra
   `next build && next start`. Sin los secrets (ej. un PR desde un fork) se saltea.

## Puesta en marcha

1. Crear la cuenta de prueba (signup normal y confirmar el mail, o en el dashboard de Supabase
   "Add user" con "Auto Confirm" y después entrar una vez para completar el onboarding).
2. `.env.local`: `E2E_EMAIL` y `E2E_PASSWORD` (ver `.env.example`).
3. GitHub → Settings → Secrets and variables → Actions: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `E2E_EMAIL`, `E2E_PASSWORD`.
4. `npm run e2e` (reusa `npm run dev` si ya está corriendo).

## Fuera de alcance

- El formulario de login y el signup (Turnstile, mails de confirmación).
- Cambiar la contraseña o el email y borrar la cuenta: acciones destructivas sobre la cuenta de
  prueba.
- El Coach (gasta cuota de Gemini) y Strava (necesita una cuenta de Strava).
