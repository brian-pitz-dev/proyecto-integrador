import { expect, test } from "@playwright/test";
import { FECHA_E2E, PNG_CHICO } from "./datos";

test("subir una foto con datos, editarla y borrarla", async ({ page }) => {
  await page.goto("/estadisticas");

  const selector = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Subir una foto" }).click();
  await (await selector).setFiles({ name: "e2e.png", mimeType: "image/png", buffer: PNG_CHICO });

  const subida = page.getByRole("dialog", { name: "Nueva foto de progreso" });
  await subida.getByLabel("Fecha").fill(FECHA_E2E);
  await subida.getByLabel("% de grasa").fill("20");
  await subida.getByLabel("Nota (opcional)").fill("foto e2e");
  await subida.getByRole("button", { name: "Subir" }).click();
  await expect(subida).toBeHidden();

  const foto = page.getByRole("listitem").filter({ hasText: "foto e2e" });
  await expect(foto).toContainText("20 % grasa");

  await foto.getByRole("button", { name: /^Editar nota, peso y grasa/ }).click();
  const edicion = page.getByRole("dialog", { name: /^Foto del/ });
  await edicion.getByLabel("Nota").fill("foto e2e editada");
  await edicion.getByRole("button", { name: "Guardar" }).click();
  await expect(edicion).toBeHidden();
  const editada = page.getByRole("listitem").filter({ hasText: "foto e2e editada" });
  await expect(editada).toBeVisible();

  await editada.getByRole("button", { name: /^Borrar la foto/ }).click();
  await page
    .getByRole("dialog", { name: /^¿Borrar la foto/ })
    .getByRole("button", { name: "Borrar" })
    .click();
  await expect(editada).toBeHidden();
});
