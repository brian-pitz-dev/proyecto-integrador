import { describe, expect, it } from "vitest";
import { edadDesde, fromISO, getMonday, toISO } from "@/lib/date";
import { formatPace, paceStrToSeconds } from "@/lib/pace";

describe("fechas", () => {
  it("toISO/fromISO van y vuelven sin correrse un día", () => {
    for (const iso of ["2026-01-01", "2026-02-28", "2026-03-01", "2026-12-31", "2028-02-29"]) {
      expect(toISO(fromISO(iso))).toBe(iso);
    }
  });

  it("edadDesde cuenta el cumpleaños recién el día que se cumple", () => {
    const hoy = fromISO("2026-11-12");
    expect(edadDesde("2000-11-12", hoy)).toBe(26);
    expect(edadDesde("2000-11-13", hoy)).toBe(25);
    expect(edadDesde("2000-12-01", hoy)).toBe(25);
  });

  it("getMonday: el domingo pertenece a la semana que empezó el lunes anterior", () => {
    expect(toISO(getMonday(fromISO("2026-11-15")))).toBe("2026-11-09"); // domingo
    expect(toISO(getMonday(fromISO("2026-11-09")))).toBe("2026-11-09"); // lunes
    expect(toISO(getMonday(fromISO("2026-11-04")))).toBe("2026-11-02"); // miércoles
  });
});

describe("ritmos", () => {
  it("formatPace redondea los segundos y no muestra :60", () => {
    expect(formatPace(330)).toBe("5:30/km");
    expect(formatPace(359.6)).toBe("6:00/km");
    expect(formatPace(305)).toBe("5:05/km");
  });

  it("paceStrToSeconds lee el ritmo de la nota de una tirada", () => {
    expect(paceStrToSeconds("1:15:30 · 5:30/km")).toBe(330);
    expect(paceStrToSeconds("sin ritmo")).toBeNull();
    expect(paceStrToSeconds(null)).toBeNull();
  });
});
