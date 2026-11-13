# Quickstart: validar Mi perfil

0. Aplicar `supabase/migrations/20261112200000_perfil_disponibilidad.sql` y
   `20261113120000_disponibilidad_historial.sql` (`supabase db push --remote`).
1. `npm test` → pasa `lib/training-plan.test.ts` (antes `scripts/check-training-days.mjs`).
2. Con una cuenta existente, el Calendario se ve igual que antes de la migración.
3. Header → ícono de usuario → `/perfil`. Elegir Mar, Jue y Sáb y guardar la semana. En el
   Calendario solo hay sesiones esos días, y la salida larga cae el sábado.
4. Elegir 30 minutos: cada día tiene una sola sesión y las rutinas de gym muestran 3
   ejercicios.
5. Agregar un evento futuro: aparece en "Tus eventos" del Calendario y su bloque de fases
   en el plan. Editarlo y borrarlo.
6. Crear una cuenta nueva: el paso Perfil pide los días y el tiempo, y el plan arranca con
   esa semana.
7. Cambiar los días en `/perfil`: las semanas pasadas del Calendario siguen igual y la semana
   en curso ya muestra los días nuevos.
8. Con 30 minutos, el cardio en cinta de la fase de caminata dice "30 min" y no "40 min".
9. "Tu cuenta" → Cambiar contraseña: al principio solo se puede escribir la contraseña actual
   (vacía) y el botón dice "Continuar". Mal da "Contraseña incorrecta", la vacía y deja el foco
   ahí; bien, la bloquea y habilita la nueva y "Repetila". Al guardar, se puede entrar con la
   nueva. Cambiar email sigue el mismo flujo (la contraseña antes que el email nuevo) y manda el
   link; al abrirlo vuelve a `/perfil` con "Listo, tu email cambió" (o con el aviso de que falta
   el otro link).
10. "Descargar mis datos" abre un popup que pide la contraseña: mal da "Contraseña incorrecta" y
    no baja nada; bien, baja `bakata-AAAA-MM-DD.json`. Un GET a `/perfil/exportar` da 405.
11. "Borrar mi cuenta" abre un popup: primero "Continuar" con la contraseña y recién después el
    botón rojo "Borrar mi cuenta". Cancelar o Esc lo cierran sin borrar nada.
