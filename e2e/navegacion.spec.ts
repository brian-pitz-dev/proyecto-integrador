import { expect, test } from "@playwright/test";

test("con sesión, todas las pestañas cargan", async ({ page }) => {
  for (const [ruta, titulo] of [
    ["/calendario", "Calendario"],
    ["/nutricion", "Nutrición"],
    ["/estadisticas", "Estadísticas"],
    ["/coach", "Coach"],
    ["/perfil", "Mi perfil"],
  ]) {
    await page.goto(ruta);
    await expect(page.getByRole("heading", { level: 1, name: titulo })).toBeVisible();
  }
});

test.describe("sin sesión", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("una página privada manda al login", async ({ page }) => {
    await page.goto("/calendario");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: /Ingresar|Verificando/ })).toBeVisible();
  });
});
