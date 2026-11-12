/**
 * Cliente mínimo de Gemini (Interactions API, tier gratis de AI Studio) — sin SDK, solo fetch.
 * "Gratis" depende de que GEMINI_API_KEY sea de un proyecto de Google Cloud SIN facturación:
 * así, pasado el límite gratis Google devuelve 429 en vez de cobrar. Ver specs/005-coach-ia.
 * Solo se importa desde Server Actions; GEMINI_API_KEY no lleva NEXT_PUBLIC_, nunca llega al cliente.
 */

// Modelos del free tier (aistudio.google.com/docs/pricing, nov-2026), en orden de preferencia.
// Si el primero está saturado (503) o sin cuota (429), se prueba el siguiente: cada modelo
// tiene su propia cuota gratis. gemini-3.8-flash se descartó: 503 frecuentes en las pruebas.
const MODELS = [
  process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const API_REVISION = "2026-05-20";
// Presupuesto total < 60 s, el límite fijo de una función de Netlify; ningún intento solo pasa de 25 s.
const TOTAL_BUDGET_MS = 50_000;
const MAX_ATTEMPT_MS = 25_000;

export type AiResult = { ok: true; text: string } | { ok: false; message: string };

interface InteractionStep {
  type?: string;
  content?: { type?: string; text?: string }[];
}

type Attempt = AiResult | { ok: false; retry: true; message: string };

async function callModel(
  model: string,
  apiKey: string,
  system: string,
  input: string,
  schema: Record<string, unknown> | undefined,
  timeoutMs: number,
): Promise<Attempt> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
        "Api-Revision": API_REVISION,
      },
      body: JSON.stringify({
        model,
        system_instruction: system,
        input,
        store: false, // no dejar la conversación guardada del lado de Google
        ...(schema && {
          response_format: { type: "text", mime_type: "application/json", schema },
        }),
      }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch {
    return { ok: false, retry: true, message: "La IA no respondió a tiempo, probá de nuevo." };
  }

  if (res.status === 429) {
    return {
      ok: false,
      retry: true,
      message: "La IA llegó a su límite gratis por ahora, probá más tarde.",
    };
  }
  if (res.status === 503) {
    return { ok: false, retry: true, message: "La IA está saturada, probá de nuevo en un rato." };
  }
  if (!res.ok) {
    console.error("Gemini error", model, res.status, await res.text().catch(() => ""));
    return { ok: false, message: "La IA tuvo un problema, probá de nuevo en un rato." };
  }

  const data = (await res.json()) as { steps?: InteractionStep[]; output_text?: string };
  const text =
    data.output_text ??
    (data.steps ?? [])
      .filter((s) => s.type === "model_output")
      .flatMap((s) => s.content ?? [])
      .filter((c) => c.type === "text" && c.text)
      .map((c) => c.text)
      .join("");

  if (!text) return { ok: false, message: "La IA devolvió una respuesta vacía, probá de nuevo." };
  return { ok: true, text };
}

/** Una llamada a Gemini. Con `schema` (JSON Schema) la respuesta es JSON que cumple ese schema. */
export async function generate({
  system,
  input,
  schema,
}: {
  system: string;
  input: string;
  schema?: Record<string, unknown>;
}): Promise<AiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, message: "La IA no está configurada todavía." };

  let last: Attempt = { ok: false, message: "La IA tuvo un problema, probá de nuevo en un rato." };
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  for (const model of MODELS) {
    const remaining = deadline - Date.now();
    if (remaining < 3_000) break;
    last = await callModel(
      model,
      apiKey,
      system,
      input,
      schema,
      Math.min(MAX_ATTEMPT_MS, remaining),
    );
    if (last.ok || !("retry" in last)) break;
  }
  return last.ok ? last : { ok: false, message: last.message };
}
