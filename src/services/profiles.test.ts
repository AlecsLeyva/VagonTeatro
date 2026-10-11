import { describe, expect, it } from "vitest";
import { sanitizeProfilePatch } from "./profiles";
import type { Profile } from "@/types";

describe("sanitizeProfilePatch", () => {
  it("conserva solo los campos editables por el propio usuario", () => {
    const patch: Partial<Profile> = {
      nombre: "Ana",
      carrera: "Teatro",
      horario_clases: "L-V 8:00-12:00",
      // campos que NO debe poder tocar el usuario:
      rol: "admin",
      correo: "otro@correo.com",
      id: "otro-id",
    };

    expect(sanitizeProfilePatch(patch)).toEqual({
      nombre: "Ana",
      carrera: "Teatro",
      horario_clases: "L-V 8:00-12:00",
    });
  });

  it("devuelve un objeto vacio si no hay campos permitidos", () => {
    expect(sanitizeProfilePatch({ rol: "director" })).toEqual({});
  });
});
