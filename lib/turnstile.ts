const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Canonical server-side Turnstile check (Cloudflare Turnstile Spin, Step 9):
 * gate on success, matching action, and an approved frontend hostname.
 * Set TURNSTILE_HOSTNAMES on the production deploy to the real domain(s) —
 * defaults to "localhost" for local dev only.
 */
export async function verifyTurnstileToken(token: string, remoteip: string): Promise<boolean> {
  const expectedAction = "login";
  const expectedHostnames = new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "localhost,127.0.0.1")
      .split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  );

  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > 2048 ||
    expectedHostnames.size === 0
  ) {
    return false;
  }

  let result: { success: boolean; action?: string; hostname?: string };
  try {
    const r = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET ?? "",
        response: token,
        remoteip,
      }),
    });
    if (!r.ok) throw new Error(`siteverify ${r.status}`);
    result = await r.json();
  } catch {
    return false;
  }

  return (
    result.success === true &&
    result.action === expectedAction &&
    !!result.hostname &&
    expectedHostnames.has(result.hostname)
  );
}
