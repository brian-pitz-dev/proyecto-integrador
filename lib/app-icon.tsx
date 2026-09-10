import { ImageResponse } from "next/og";

export function renderAppIcon(size: number) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        color: "#fafafa",
        fontFamily: "monospace",
        fontWeight: 700,
        fontSize: size * 0.5,
      }}
    >
      PV
    </div>,
    { width: size, height: size },
  );
}
