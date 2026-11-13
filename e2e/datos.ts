/** Cookies de la sesión de la cuenta de prueba, que arma global-setup.ts. */
export const ESTADO = "e2e/.auth/estado.json";

/**
 * Fecha de todo lo que cargan los tests: lejos de cualquier dato real de la cuenta de prueba.
 * global-setup.ts borra lo de ese año por si una corrida anterior falló a la mitad.
 */
export const ANIO_E2E = "2020";
export const FECHA_E2E = `${ANIO_E2E}-01-02`;

/** PNG de 4×3 px: alcanza para subir una foto (el navegador la pasa a JPEG). */
export const PNG_CHICO = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7ljmRAAAAEElEQVR4nGM4UWEDRww4OQBiHhHR6R4GfQAAAABJRU5ErkJggg==",
  "base64",
);
