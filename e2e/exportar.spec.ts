import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("descargar mis datos pide la contraseña", async ({ page }) => {
  await page.goto("/perfil");
  await page.getByRole("button", { name: "Descargar mis datos" }).click();
  const dialogo = page.getByRole("dialog", { name: "Descargar mis datos" });
  const clave = dialogo.getByLabel("Tu contraseña");

  // una sola vez mal: comparte el límite del login (5 cada 5 minutos)
  await clave.fill("mala-e2e-123");
  await clave.press("Enter");
  await expect(page.getByText("Contraseña incorrecta.")).toBeVisible();
  await expect(clave).toHaveValue("");

  const descarga = page.waitForEvent("download");
  await clave.fill(process.env.E2E_PASSWORD!);
  await clave.press("Enter");
  const archivo = await descarga;
  expect(archivo.suggestedFilename()).toMatch(/^bakata-\d{4}-\d{2}-\d{2}\.json$/);

  const datos = JSON.parse(await readFile(await archivo.path(), "utf8"));
  expect(Object.keys(datos)).toEqual(
    expect.arrayContaining(["perfil", "eventos", "registros", "fotos"]),
  );
  expect(datos.cuenta.email).toBe(process.env.E2E_EMAIL);
});
