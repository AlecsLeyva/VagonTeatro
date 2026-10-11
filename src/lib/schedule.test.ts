import { describe, it, expect } from "vitest";
import { extractWeekDays, hasScheduleConflict } from "./schedule";

describe("extractWeekDays", () => {
  it("detecta dias escritos con nombre", () => {
    expect(extractWeekDays("Lunes y miércoles 07:00-09:00")).toEqual([
      "lun",
      "mie",
    ]);
  });

  it("detecta rangos cortos como L-V", () => {
    expect(extractWeekDays("L-V 08:00 a 12:00")).toEqual([
      "lun",
      "mar",
      "mie",
      "jue",
    ]);
  });

  it("detecta rangos con nombres largos", () => {
    expect(extractWeekDays("martes a jueves")).toEqual(["mar", "mie", "jue"]);
  });

  it("ignora rangos de horas", () => {
    expect(extractWeekDays("07:00-13:00")).toEqual([]);
  });

  it("devuelve vacio sin texto", () => {
    expect(extractWeekDays(null)).toEqual([]);
  });
});

describe("hasScheduleConflict", () => {
  it("detecta choque entre ensayo y clase el mismo dia", () => {
    expect(hasScheduleConflict("Lun, Mié 10:00-12:00", "miércoles 07:00-09:00")).toBe(
      true,
    );
  });

  it("no marca choque cuando los dias no coinciden", () => {
    expect(hasScheduleConflict("Lun, Mar", "miércoles y jueves")).toBe(false);
  });

  it("no marca choque sin horario de clases", () => {
    expect(hasScheduleConflict("Lunes", null)).toBe(false);
  });

  it("no marca choque sin dias de ensayo", () => {
    expect(hasScheduleConflict(null, "lunes 08:00-10:00")).toBe(false);
  });
});
