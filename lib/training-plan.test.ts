import { describe, expect, it } from "vitest";
import {
  ajustarMinutos,
  buildPlan,
  registrarCambioDisponibilidad,
  getPhaseKeyForDate,
  getSessionsForDate,
  semanaDeRetome,
  type Disponibilidad,
  type UserEvent,
} from "@/lib/training-plan";
import { addDays, fromISO, toISO } from "@/lib/date";

const REGISTRO = "2026-11-04"; // miércoles
const hoy = fromISO(REGISTRO);

function evento(tipo: UserEvent["tipo"], fecha: string, distanciaKm: number): UserEvent {
  return { id: fecha, tipo, nombre: `${tipo} ${distanciaKm}K`, fecha, distanciaKm };
}

/** Fases del plan en orden, colapsando semanas seguidas iguales: "p6×2 p1×4 p3×1 …". */
function fases(weeks: ReturnType<typeof buildPlan>, hasta = weeks.length) {
  const out: string[] = [];
  let prev = "";
  let n = 0;
  for (const w of weeks.slice(0, hasta)) {
    if (w.phaseKey === prev) n++;
    else {
      if (prev) out.push(`${prev}×${n}`);
      prev = w.phaseKey;
      n = 1;
    }
  }
  out.push(`${prev}×${n}`);
  return out.join(" ");
}

describe("buildPlan", () => {
  it("sin eventos: todo mantenimiento, semanas de lunes a domingo, al menos 12 por delante", () => {
    const weeks = buildPlan(REGISTRO, [], hoy);
    expect(weeks[0].start).toBe("2026-11-02");
    expect(weeks.every((w) => w.phaseKey === "p6")).toBe(true);
    expect(weeks.length).toBeGreaterThanOrEqual(12);
    weeks.slice(1).forEach((w, i) => {
      expect(fromISO(w.start).getTime()).toBe(addDays(fromISO(weeks[i].start), 7).getTime());
    });
  });

  it("los días de la semana 1 anteriores al registro no tienen sesiones", () => {
    const [semana1] = buildPlan(REGISTRO, [], hoy);
    expect(semana1.cfg.mon).toBeNull();
    expect(semana1.cfg.tue).toBeNull();
    expect(getSessionsForDate(buildPlan(REGISTRO, [], hoy), [], fromISO("2026-11-01"))).toEqual([
      expect.objectContaining({ tag: "rest" }),
    ]);
  });

  it("carrera corta con 6 semanas: 2 de mantenimiento + 4 de construcción, después recuperación", () => {
    const diezK = evento("carrera", "2026-12-13", 10);
    const weeks = buildPlan(REGISTRO, [diezK], hoy);
    expect(fases(weeks, 7)).toBe("p6×2 p1×4 p3×1");
    expect(getPhaseKeyForDate(weeks, fromISO(diezK.fecha))).toBe("p1");
    expect(weeks[5].isEventWeek).toBe(true);
    expect(weeks[4].isPrepWeek).toBe(true);
  });

  it("carrera larga con 2 semanas: comprime la construcción pero nunca saltea el taper", () => {
    const weeks = buildPlan(REGISTRO, [evento("carrera", "2026-11-15", 21)], hoy);
    expect(fases(weeks, 3)).toBe("p4×1 p5×1 p3×1");
  });

  it("carrera seguida de caminata: sin semana de recuperación entre las dos", () => {
    const weeks = buildPlan(
      REGISTRO,
      [evento("caminata", "2026-12-20", 80), evento("carrera", "2026-11-29", 10)],
      hoy,
    );
    // 10K justo a 4 semanas (sin relleno) → caminata 3 semanas después → recién ahí recuperación
    expect(fases(weeks, 8)).toBe("p1×4 p2×3 p3×1");
  });
});

// Ex scripts/check-training-days.mjs: adaptación del plan a los días/minutos del usuario (spec 006).
describe("adaptación a días y minutos", () => {
  const today = fromISO("2026-11-12");
  const events: UserEvent[] = [
    { id: "a", tipo: "carrera", nombre: "10K", fecha: "2026-12-20", distanciaKm: 10 },
    { id: "b", tipo: "caminata", nombre: "Caminata", fecha: "2027-01-24", distanciaKm: 60 },
    { id: "c", tipo: "carrera", nombre: "21K", fecha: "2027-03-14", distanciaKm: 21.1 },
  ];
  const plan = (disp?: Disponibilidad) => buildPlan("2026-11-09", events, today, disp);
  const base = plan();
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
  type Cfg = (typeof base)[number]["cfg"];
  const entrena = (cfg: Cfg, d: number) => (cfg[days[d]] ?? []).some((s) => s.tag !== "rest");
  const sesiones = (cfg: Cfg) => Object.values(cfg).flatMap((ss) => ss ?? []);
  const tieneLarga = (cfg: Cfg) => sesiones(cfg).some((s) => s.tag === "long" || s.tag === "walk");

  it("con los días de la plantilla (o todos) y 60'+ da exactamente el plan de siempre", () => {
    expect(plan({ dias: [0, 1, 2, 3, 4, 5], minutos: 60 })).toEqual(base);
    expect(plan({ dias: [0, 1, 2, 3, 4, 5, 6], minutos: 90 })).toEqual(base);
  });

  it("nunca entrena fuera de los días elegidos, y la salida larga sobrevive", () => {
    for (const dias of [[5], [1, 5], [0, 2, 5], [1, 3, 6], [0, 1, 3, 5], [2, 3, 4, 5, 6]]) {
      for (const w of plan({ dias, minutos: 60 })) {
        for (let d = 0; d < 7; d++)
          if (entrena(w.cfg, d)) expect(dias, `semana ${w.num} día ${d}`).toContain(d);
        // es la de mayor prioridad: si la plantilla la tenía, sigue estando
        expect(tieneLarga(w.cfg), `semana ${w.num} con días ${dias}`).toBe(
          tieneLarga(base[w.num - 1].cfg),
        );
      }
    }
  });

  it("los descansos con nombre (pre-carrera, piernas frescas, carbohidratos) no se pisan", () => {
    const conNombre = (cfg: Cfg, d: number) =>
      (cfg[days[d]] ?? []).find((s) => s.tag === "rest" && s.label !== "Descanso")?.label;
    for (const dias of [
      [1, 3, 5],
      [3, 4, 5],
      [0, 1, 2, 3, 4, 5],
    ]) {
      for (const w of plan({ dias, minutos: 30 })) {
        for (let d = 0; d < 7; d++) {
          const label = conNombre(base[w.num - 1].cfg, d);
          if (label)
            expect(w.cfg[days[d]], `semana ${w.num} día ${d}`).toEqual([{ tag: "rest", label }]);
        }
      }
    }
  });

  it("antes de un evento, con 3 días correr le gana al gym", () => {
    const p1 = plan({ dias: [1, 3, 5], minutos: 60 }).find((w) => w.phaseKey === "p1");
    const tags = sesiones(p1!.cfg).map((s) => s.tag);
    expect(tags).not.toContain("gym");
    expect(tags).toContain("long");
    expect(tags).toContain("run");
  });

  it("en mantenimiento, con pocos días el gym rota entre rutinas", () => {
    const keys = new Set(
      plan({ dias: [0, 2, 5], minutos: 60 })
        .filter((w) => w.phaseKey === "p6")
        .flatMap((w) => sesiones(w.cfg).map((s) => s.gymKey))
        .filter(Boolean),
    );
    expect(keys.size).toBeGreaterThanOrEqual(2);
  });

  it("con 30' una sesión por día y rutinas de 3 ejercicios; con 45', de 4", () => {
    for (const [minutos, tope] of [
      [30, 3],
      [45, 4],
    ]) {
      for (const w of plan({ dias: [0, 1, 2, 3, 4, 5], minutos })) {
        for (const ss of Object.values(w.cfg)) {
          expect((ss ?? []).length).toBeLessThanOrEqual(1);
          for (const s of ss ?? [])
            if (s.tag === "gym" || s.tag === "core") expect(s.maxEjercicios).toBe(tope);
        }
      }
    }
  });

  it("un plan que arranca un jueves igual tiene semanas de lunes a domingo", () => {
    const jueves = buildPlan("2026-11-12", events, today, { dias: [1, 3, 5], minutos: 30 });
    expect(jueves[0].start).toBe("2026-11-09");
    expect(fromISO(jueves[0].start).getDay()).toBe(1);
  });

  it("registro un sábado: lunes a viernes de esa semana sin sesiones, desde el registro sí", () => {
    const sabado = buildPlan("2026-11-14", events, fromISO("2026-11-14"));
    for (let d = 0; d < 5; d++) {
      const ss = getSessionsForDate(sabado, events, addDays(fromISO("2026-11-09"), d));
      expect(
        ss.every((s) => s.tag === "rest"),
        `día ${d} antes del registro`,
      ).toBe(true);
    }
    expect(
      getSessionsForDate(sabado, events, fromISO("2026-11-14")).some((s) => s.tag !== "rest"),
    ).toBe(true);
  });

  it("con 30' el cardio en cinta dice 30 min, no los 40 de la plantilla", () => {
    const p2 = plan({ dias: [0, 1, 2, 3, 4, 5], minutos: 30 }).find((w) => w.phaseKey === "p2")!;
    expect(p2.cfg.tue?.[0].detail).toBe(
      "5.5 km/h con inclinación 8-10% · 30 min · caminata en cinta",
    );
  });

  it("si cambia la disponibilidad, las semanas anteriores al cambio quedan como estaban", () => {
    const nueva = { dias: [1, 3, 5], minutos: 30 };
    const conHistorial = buildPlan("2026-11-09", events, today, nueva, [
      { hasta: "2026-11-23", dias: [0, 1, 2, 3, 4, 5], minutos: 60 },
    ]);
    const todoNuevo = plan(nueva);
    conHistorial.forEach((w, i) =>
      expect(w).toEqual(w.start < "2026-11-23" ? base[i] : todoNuevo[i]),
    );
  });
});

describe("registrarCambioDisponibilidad", () => {
  const jueves = fromISO("2026-11-12");
  const antes = { dias: [0, 1, 2, 3, 4, 5], minutos: 60 };

  it("guarda la anterior hasta el lunes de la semana del cambio", () => {
    expect(registrarCambioDisponibilidad([], antes, { dias: [1, 3], minutos: 60 }, jueves)).toEqual(
      [{ ...antes, hasta: "2026-11-09" }],
    );
  });

  it("sin cambios reales (o con los días en otro orden) no agrega nada", () => {
    expect(
      registrarCambioDisponibilidad([], antes, { dias: [5, 4, 3, 2, 1, 0], minutos: 60 }, jueves),
    ).toEqual([]);
  });

  it("un segundo cambio en la misma semana conserva la de antes del primero", () => {
    const h = registrarCambioDisponibilidad([], antes, { dias: [1, 3], minutos: 60 }, jueves);
    expect(
      registrarCambioDisponibilidad(
        h,
        { dias: [1, 3], minutos: 60 },
        { dias: [2], minutos: 30 },
        jueves,
      ),
    ).toBe(h);
  });
});

describe("ajustarMinutos", () => {
  it("achica minutos y rangos al tope", () => {
    expect(ajustarMinutos("8.0 km/h · 30-35 min · continuo", 30)).toBe(
      "8.0 km/h · 26-30 min · continuo",
    );
    expect(ajustarMinutos("Caminata inclinada 50' · 5.5 km/h · 8-10%", 45)).toBe(
      "Caminata inclinada 45' · 5.5 km/h · 8-10%",
    );
  });

  it("cuenta los bloques N×[...] N veces y no toca lo que ya entra", () => {
    const series = "5' a 7 km/h · 5×[2' a 10 km/h / 1' a 7 km/h] · 5' a 7 km/h"; // 25'
    expect(ajustarMinutos(series, 30)).toBe(series);
    expect(ajustarMinutos(series, 20)).toBe(
      "4' a 7 km/h · 5×[2' a 10 km/h / 1' a 7 km/h] · 4' a 7 km/h",
    );
    expect(ajustarMinutos("8 km, ritmo libre", 30)).toBe("8 km, ritmo libre");
  });

  it("las series en km cuentan su ritmo y su pausa, y se recortan sacando repeticiones", () => {
    // 10 + 5×(6 + 2) + 10 = 60'
    expect(ajustarMinutos("10' suave + 5×1 km a 6:00/km (2' trote) + 10' suave", 30)).toBe(
      "5' suave + 2×1 km a 6:00/km (2' trote) + 5' suave",
    );
    // sin ritmo en el texto se estima a 6:00/km: 10 + 4×8 + 10 = 52'
    const sinRitmo = (n: number, m: number) =>
      `${m}' suave + ${n}×1 km a ritmo de series (algo más rápido que el de carrera) (2' trote) + ${m}' suave`;
    expect(ajustarMinutos(sinRitmo(4, 10), 45)).toBe(sinRitmo(3, 9));
    // nunca menos de una repetición: 10 + 2×(20 + 3) + 5 = 61'
    expect(ajustarMinutos("10' suave + 2×4 km a 5:00/km (3' trote) + 5' suave", 30)).toBe(
      "5' suave + 1×4 km a 5:00/km (3' trote) + 2' suave",
    );
    expect(ajustarMinutos(sinRitmo(4, 10), 60)).toBe(sinRitmo(4, 10));
  });
});

describe("semana de retome", () => {
  // plan desde el lunes 5/10, sin eventos; hoy es el miércoles de la semana 3 (19/10)
  const INICIO = "2026-10-05";
  const HOY = fromISO("2026-10-21");
  const disp: Disponibilidad = { dias: [0, 1, 2, 3, 4, 5], minutos: 60 };
  const plan = (eventos: UserEvent[] = [], retome?: string) =>
    buildPlan(INICIO, eventos, HOY, disp, [], retome);
  /** Días entrenables de la semana pasada (12 al 18/10). */
  const entrenablesPasada = (weeks = plan()) =>
    Array.from({ length: 7 }, (_, d) => addDays(fromISO("2026-10-12"), d)).filter((dia) =>
      getSessionsForDate(weeks, [], dia).some((s) => s.tag !== "rest"),
    );

  it("con menos de la mitad hecha la semana pasada, la de hoy es de retome", () => {
    const hechos = new Set([toISO(entrenablesPasada()[0])]);
    expect(semanaDeRetome(plan(), [], hechos, HOY)).toEqual({
      start: "2026-10-19",
      hechos: 1,
      entrenables: entrenablesPasada().length,
    });
  });

  it("con la mitad o más hecha, no", () => {
    const dias = entrenablesPasada();
    const mitad = new Set(dias.slice(0, Math.ceil(dias.length / 2)).map(toISO));
    expect(semanaDeRetome(plan(), [], mitad, HOY)).toBeNull();
  });

  it("no toca la semana de un evento ni la primera del plan", () => {
    const carrera = [evento("carrera", "2026-10-25", 10)];
    expect(semanaDeRetome(plan(carrera), carrera, new Set(), HOY)).toBeNull();
    expect(semanaDeRetome(plan(), [], new Set(), fromISO("2026-10-07"))).toBeNull();
  });

  it("la semana de retome va con un escalón menos de minutos, y solo esa", () => {
    const normal = plan();
    const retome = plan([], "2026-10-19");
    const semana = (weeks: typeof normal, start: string) => weeks.find((w) => w.start === start)!;
    expect(semana(retome, "2026-10-19").retome).toBe(true);
    // con 45' (60 → 45) cada día queda con su sesión principal y rutinas de 4 ejercicios
    const sesiones = Object.values(semana(retome, "2026-10-19").cfg).flatMap((s) => s ?? []);
    expect(sesiones.some((s) => s.maxEjercicios === 4)).toBe(true);
    expect(semana(retome, "2026-10-26")).toEqual(semana(normal, "2026-10-26"));
    expect(semana(retome, "2026-10-12")).toEqual(semana(normal, "2026-10-12"));
  });
});
