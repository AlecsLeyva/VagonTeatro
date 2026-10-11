import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

function Demo() {
  return (
    <Tabs defaultValue="a">
      <TabsList>
        <TabsTrigger value="a">Uno</TabsTrigger>
        <TabsTrigger value="b">Dos</TabsTrigger>
        <TabsTrigger value="c">Tres</TabsTrigger>
      </TabsList>
      <TabsContent value="a">Contenido uno</TabsContent>
      <TabsContent value="b">Contenido dos</TabsContent>
      <TabsContent value="c">Contenido tres</TabsContent>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("muestra el panel inicial y marca su pestaña como seleccionada", () => {
    render(<Demo />);
    const tabUno = screen.getByRole("tab", { name: "Uno" });
    expect(tabUno).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Contenido uno")).toBeInTheDocument();
  });

  it("cambia de panel al hacer clic", () => {
    render(<Demo />);
    fireEvent.click(screen.getByRole("tab", { name: "Dos" }));
    expect(screen.getByText("Contenido dos")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Dos" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("navega con las flechas del teclado", () => {
    render(<Demo />);
    const tabUno = screen.getByRole("tab", { name: "Uno" });
    tabUno.focus();
    fireEvent.keyDown(tabUno, { key: "ArrowRight" });
    const tabDos = screen.getByRole("tab", { name: "Dos" });
    expect(tabDos).toHaveAttribute("aria-selected", "true");
    expect(tabDos).toHaveFocus();

    fireEvent.keyDown(tabDos, { key: "End" });
    expect(screen.getByRole("tab", { name: "Tres" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.keyDown(screen.getByRole("tab", { name: "Tres" }), {
      key: "Home",
    });
    expect(tabUno).toHaveAttribute("aria-selected", "true");
  });

  it("conecta pestañas y paneles con aria-controls/aria-labelledby", () => {
    render(<Demo />);
    const tabUno = screen.getByRole("tab", { name: "Uno" });
    const panelUno = screen.getByRole("tabpanel");
    expect(tabUno).toHaveAttribute("aria-controls", panelUno.id);
    expect(panelUno).toHaveAttribute("aria-labelledby", tabUno.id);
  });
});
