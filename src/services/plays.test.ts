import { describe, expect, it } from "vitest";
import { mergePlaysById } from "./plays";
import type { Play } from "@/types";

function makePlay(id: string, createdAt: string | undefined): Play {
  return {
    id,
    titulo: `Obra ${id}`,
    descripcion: null,
    director_id: "d1",
    subdirector_id: null,
    guion_url: null,
    utileria: null,
    dias_asignados: null,
    estado: "activa",
    created_at: createdAt,
  };
}

describe("mergePlaysById", () => {
  it("combina listas sin duplicados y ordena por fecha descendente", () => {
    const a = makePlay("a", "2024-01-01T00:00:00Z");
    const b = makePlay("b", "2024-03-01T00:00:00Z");
    const c = makePlay("c", "2024-02-01T00:00:00Z");

    // 'b' aparece en ambas listas: no debe duplicarse.
    const result = mergePlaysById([a, b], [b, c]);

    expect(result.map((play) => play.id)).toEqual(["b", "c", "a"]);
  });

  it("devuelve una lista vacia sin entradas", () => {
    expect(mergePlaysById([], [])).toEqual([]);
  });
});
