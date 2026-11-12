"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Script from "next/script";
import { useTheme } from "next-themes";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          action: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "flexible" | "compact";
          appearance?: "always" | "execute" | "interaction-only";
          language?: string;
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Cloudflare Turnstile compartido por login y registro. El iframe de Cloudflare no se puede
 * estilar, así que se configura para que moleste lo menos posible: invisible salvo que pida
 * interacción, con el tema de la app y al ancho del formulario.
 */
export function useTurnstile(action: string) {
  const [token, setToken] = useState("");
  const widgetIdRef = useRef<string | null>(null);

  /** Los tokens son de un solo uso: pedir uno nuevo después de cada intento fallido. */
  function reset() {
    setToken("");
    if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
  }

  return {
    enabled: !!SITE_KEY,
    token,
    /** Todavía no hay token: conviene deshabilitar el envío. */
    verifying: !!SITE_KEY && !token,
    reset,
    widget: SITE_KEY ? (
      <TurnstileWidget action={action} onToken={setToken} widgetIdRef={widgetIdRef} />
    ) : null,
  };
}

function TurnstileWidget({
  action,
  onToken,
  widgetIdRef,
}: {
  action: string;
  onToken: (token: string) => void;
  widgetIdRef: RefObject<string | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Poll en vez de <Script onLoad>: el orden de carga afterInteractive de Next no garantiza
    // que el script ya esté cuando se monta el contenedor (ni al revés).
    const interval = setInterval(() => {
      if (!window.turnstile || !containerRef.current) return;
      clearInterval(interval);
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY!,
        action,
        callback: onToken,
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
        theme: resolvedTheme === "light" ? "light" : "dark",
        size: "flexible",
        appearance: "interaction-only",
        language: "es",
      });
    }, 150);
    return () => {
      clearInterval(interval);
      if (widgetIdRef.current) window.turnstile?.remove(widgetIdRef.current);
      widgetIdRef.current = null;
      onToken("");
    };
    // si cambia el tema de la app, se vuelve a crear el widget con el tema nuevo
  }, [action, onToken, resolvedTheme, widgetIdRef]);

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" />
      {/* vacío (0 px) mientras Cloudflare no necesite interacción */}
      <div ref={containerRef} className="empty:hidden" />
    </>
  );
}
