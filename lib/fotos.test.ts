import { describe, expect, it } from "vitest";
import { esJpeg, fechaDeArchivo, fechaFotoValida, fotoPath } from "@/lib/fotos";
import { datosFotoSchema } from "@/lib/validation/registro";

describe("fotos de progreso", () => {
  it("el path y la fecha del archivo van y vuelven", () => {
    const path = fotoPath("u1", "2026-11-13");
    expect(path).toBe("u1/2026-11-13.jpg");
    expect(fechaDeArchivo(path.split("/")[1])).toBe("2026-11-13");
    expect(fechaDeArchivo(".emptyFolderPlaceholder")).toBeNull();
    expect(fechaDeArchivo("2026-11-13.png")).toBeNull();
  });

  it("la fecha tiene que existir y no ser futura", () => {
    expect(fechaFotoValida("2026-11-13", "2026-11-13")).toBe(true);
    expect(fechaFotoValida("2026-11-14", "2026-11-13")).toBe(false);
    expect(fechaFotoValida("2026-02-30", "2026-11-13")).toBe(false);
    expect(fechaFotoValida("13/11/2026", "2026-11-13")).toBe(false);
    expect(fechaFotoValida("../otro/2026-11-13", "2026-11-13")).toBe(false);
  });

  it("nota, peso y grasa: vacío es null, lo que no viene no aparece, fuera de rango falla", () => {
    expect(datosFotoSchema.parse({ nota: "  ", peso: "68.5", grasa: "" })).toEqual({
      nota: null,
      peso: 68.5,
      grasa: null,
    });
    expect(datosFotoSchema.parse({ grasa: "22" })).toEqual({ grasa: 22 });
    expect(datosFotoSchema.safeParse({ peso: "5" }).success).toBe(false);
    expect(datosFotoSchema.safeParse({ grasa: "abc" }).success).toBe(false);
    expect(datosFotoSchema.safeParse({ nota: "x".repeat(141) }).success).toBe(false);
  });

  it("reconoce un JPEG por sus primeros bytes", () => {
    expect(esJpeg(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
    // PNG con nombre .jpg
    expect(esJpeg(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false);
    expect(esJpeg(new Uint8Array([]))).toBe(false);
  });
});
