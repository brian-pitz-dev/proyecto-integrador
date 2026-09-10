import { ImageResponse } from "next/og";

export const alt = "Plan de Vida 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        color: "#fafafa",
        fontFamily: "monospace",
      }}
    >
      <div style={{ fontSize: 72, fontWeight: 700 }}>Plan de Vida 2026</div>
      <div style={{ fontSize: 32, color: "#a1a1aa", marginTop: 16 }}>
        Ejercicio · Nutrición · Calendario
      </div>
    </div>,
    { ...size },
  );
}
