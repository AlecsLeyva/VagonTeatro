import { describe, expect, it } from "vitest";
import {
  objectPathFromStored,
  pathFromPublicUrl,
  scriptFileName,
} from "./storage";

const PUBLIC_URL =
  "https://example.supabase.co/storage/v1/object/public/scripts-guiones/play-1/1700000000000-hamlet.pdf";

describe("pathFromPublicUrl", () => {
  it("extrae la ruta de una URL pública del bucket", () => {
    expect(pathFromPublicUrl(PUBLIC_URL)).toBe(
      "play-1/1700000000000-hamlet.pdf",
    );
  });

  it("devuelve null para valores que no son URLs del bucket", () => {
    expect(pathFromPublicUrl("play-1/archivo.pdf")).toBeNull();
    expect(pathFromPublicUrl("https://otro-sitio.com/archivo.pdf")).toBeNull();
  });
});

describe("objectPathFromStored", () => {
  it("acepta rutas nuevas tal cual", () => {
    expect(objectPathFromStored("play-1/1700000000000-hamlet.pdf")).toBe(
      "play-1/1700000000000-hamlet.pdf",
    );
  });

  it("convierte URL públicas antiguas a rutas", () => {
    expect(objectPathFromStored(PUBLIC_URL)).toBe(
      "play-1/1700000000000-hamlet.pdf",
    );
  });
});

describe("scriptFileName", () => {
  it("recorta el prefijo numérico y la carpeta", () => {
    expect(scriptFileName("play-1/1700000000000-hamlet.pdf")).toBe(
      "hamlet.pdf",
    );
    expect(scriptFileName(PUBLIC_URL)).toBe("hamlet.pdf");
  });
});
