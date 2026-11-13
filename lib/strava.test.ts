import { describe, expect, it } from "vitest";
import { aRegistros, type ActividadStrava } from "@/lib/strava";
import { paceStrToSeconds } from "@/lib/pace";

const actividad = (a: Partial<ActividadStrava>): ActividadStrava => ({
  sport_type: "Run",
  distance: 10_000,
  moving_time: 55 * 60,
  start_date: "2026-11-13T10:30:00Z",
  start_date_local: "2026-11-13T07:30:00Z",
  ...a,
});

describe("aRegistros", () => {
  it("una corrida es una tirada con tiempo y ritmo en la nota, como el formulario", () => {
    const [r] = aRegistros([actividad({})]);
    expect(r).toEqual({
      categoria: "tirada",
      fecha: "2026-11-13",
      valor: 10,
      nota: "55min · 5:30/km",
    });
    // Estadísticas lee el ritmo de la nota
    expect(paceStrToSeconds(r.nota)).toBe(330);
  });

  it("la fecha es la local del atleta, no la UTC", () => {
    const [r] = aRegistros([
      actividad({ start_date: "2026-11-14T01:30:00Z", start_date_local: "2026-11-13T22:30:00Z" }),
    ]);
    expect(r.fecha).toBe("2026-11-13");
  });

  it("más de una hora: '1h 5min'; trail y cinta también son corridas", () => {
    const r = aRegistros([
      actividad({ sport_type: "TrailRun", distance: 12_345, moving_time: 65 * 60 }),
      actividad({ sport_type: "VirtualRun" }),
    ]);
    expect(r.map((x) => x.categoria)).toEqual(["tirada", "tirada"]);
    expect(r[0].valor).toBe(12.35);
    expect(r[0].nota).toMatch(/^1h 5min · /);
  });

  it("caminatas sin nota; bici, gym y lo de menos de 500 m se ignoran", () => {
    expect(
      aRegistros([
        actividad({ sport_type: "Walk", distance: 4200 }),
        actividad({ sport_type: "Hike", distance: 8000 }),
        actividad({ sport_type: "Ride", distance: 30_000 }),
        actividad({ sport_type: "WeightTraining", distance: 0 }),
        actividad({ distance: 300 }),
      ]),
    ).toEqual([
      { categoria: "caminata", fecha: "2026-11-13", valor: 4.2, nota: null },
      { categoria: "caminata", fecha: "2026-11-13", valor: 8, nota: null },
    ]);
  });
});
