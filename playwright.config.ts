import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { ESTADO } from "./e2e/datos";

// las mismas variables que la app: .env.local en tu máquina; en CI vienen del entorno
loadEnvConfig(process.cwd());

/**
 * Tests end-to-end (specs/008-tests-e2e): corren contra el Supabase real con una cuenta de prueba
 * propia (E2E_EMAIL / E2E_PASSWORD). En tu máquina reusan `npm run dev` si ya está corriendo.
 */
export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  // una sola cuenta de prueba: en paralelo los tests se pisarían los datos
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    storageState: ESTADO,
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.CI ? "npm run build && npm run start" : "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
