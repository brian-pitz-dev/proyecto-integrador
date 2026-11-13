import { expect, test } from "@playwright/test";
import { FECHA_E2E } from "./datos";

test("cargar un peso y borrarlo", async ({ page }) => {
  await page.goto("/estadisticas");
  // "Peso" también es el título del gráfico de Evolución: la de registros es la que tiene "+ Cargar"
  const tarjeta = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText("Peso", { exact: true }) })
    .filter({ has: page.getByRole("button", { name: "+ Cargar" }) });

  await tarjeta.getByRole("button", { name: "+ Cargar" }).click();
  const dialogo = page.getByRole("dialog", { name: "Peso" });
  await dialogo.getByLabel("Peso (kg)").fill("77.7");
  await dialogo.getByLabel("Fecha").fill(FECHA_E2E);
  await dialogo.getByRole("button", { name: "Guardar" }).click();
  await expect(dialogo).toBeHidden();

  const fila = tarjeta.getByRole("listitem").filter({ hasText: "77.7 kg" });
  await expect(fila).toBeVisible();
  await fila.getByRole("button", { name: "Borrar registro" }).click();
  await page
    .getByRole("dialog", { name: "¿Borrar este registro?" })
    .getByRole("button", { name: "Borrar" })
    .click();
  await expect(fila).toBeHidden();
});
