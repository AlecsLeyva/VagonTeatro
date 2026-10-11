import { describe, it, expect } from "vitest";
import { matchesText, normalizeText, initials } from "./utils";

describe("normalizeText", () => {
  it("quita acentos y mayusculas", () => {
    expect(normalizeText("Ángel Ramírez")).toBe("angel ramirez");
  });

  it("recorta espacios sobrantes", () => {
    expect(normalizeText("  Hola  ")).toBe("hola");
  });
});

describe("matchesText", () => {
  it("coincide ignorando acentos", () => {
    expect(matchesText("angel", "Ángel", "correo@x.com")).toBe(true);
  });

  it("coincide ignorando mayusculas y en cualquier campo", () => {
    expect(matchesText("RAMIREZ", "Juan", "Ramírez")).toBe(true);
  });

  it("devuelve true cuando el termino esta vacio", () => {
    expect(matchesText("   ", "cualquiera")).toBe(true);
  });

  it("devuelve false cuando no hay coincidencias", () => {
    expect(matchesText("perez", "Ángel", "correo@x.com")).toBe(false);
  });
});

describe("initials", () => {
  it("toma las dos primeras iniciales", () => {
    expect(initials("Ana María González")).toBe("AM");
  });
});
