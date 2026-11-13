# Quickstart: poner en marcha y validar Strava

## Puesta en marcha

1. Aplicar `supabase/migrations/20261113200000_strava.sql` (`supabase db push --remote`).
2. Crear la app en https://www.strava.com/settings/api: nombre "Bakata", sitio
   `https://bakata.netlify.app`, y "Authorization Callback Domain" `localhost` para probar en
   local (en producción, `bakata.netlify.app`; Strava acepta un solo dominio por app).
3. Copiar "Client ID" y "Client Secret" a `.env.local` como `STRAVA_CLIENT_ID` y
   `STRAVA_CLIENT_SECRET`, y en Netlify (`netlify env:set`). Reiniciar `npm run dev`.

## Validar

1. `npm test` → pasa `lib/strava.test.ts`.
2. Estadísticas → "Conectar con Strava" → autorizar: vuelve con "Strava conectado".
3. Probar "Cancelar" en Strava: vuelve con "No se conectó". Destildar el permiso de
   actividades: vuelve pidiendo dejarlo tildado.
4. "Importar de Strava": las corridas de los últimos 30 días aparecen en "Tirada larga" con
   tiempo y ritmo; las caminatas, en "Caminata". Importar de nuevo: "No hay corridas ni
   caminatas nuevas".
5. Subir una actividad nueva a Strava e importar: entra solo esa.
6. "Desconectar": en https://www.strava.com/settings/apps ya no aparece Bakata; lo importado
   sigue en Registros.
7. "Descargar mis datos" trae `strava` con `athlete_id` y sin tokens.
