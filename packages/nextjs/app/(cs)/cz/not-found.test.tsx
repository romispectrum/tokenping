// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound, { metadata } from "~~/app/(cs)/cz/not-found";

describe("/cz not-found", () => {
  it("has a Czech title", () => {
    expect(metadata.title).toBe("Stránka nenalezena");
  });

  it("names the page in Czech in its one h1 and links the Czech sections", () => {
    render(<NotFound />);

    expect(screen.getAllByRole("heading", { level: 1 }).map(heading => heading.textContent)).toEqual([
      "Stránka nenalezena",
    ]);
    expect(screen.getByText("Stránka, kterou hledáte, neexistuje.")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Stránky" })).toBeTruthy();
    expect(screen.getAllByRole("link").map(link => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Přejít na úvodní stránku", "/cz"],
      ["Otevřít přehled", "/cz/aave"],
      ["Číst blog", "/cz/blog"],
    ]);
  });

  it("makes the Czech home page link the one pink action, with the code in a kicker", () => {
    const { container } = render(<NotFound />);
    const links = screen.getAllByRole("link");

    expect(links.map(link => link.className.includes("btn-primary"))).toEqual([true, false, false]);
    expect(screen.getByRole("heading", { level: 1 }).previousElementSibling?.textContent).toBe("Chyba 404");
    expect(container.innerHTML).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
  });
});
