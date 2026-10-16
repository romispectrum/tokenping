// @vitest-environment jsdom
import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NotFound, { metadata } from "~~/app/(en)/not-found";
import GlobalNotFound, { metadata as globalMetadata } from "~~/app/global-not-found";

// The global 404 brings its own <html> document (fonts, providers); only the page inside it is under test here.
vi.mock("~~/components/RootDocument", () => ({
  rootDocument: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("not-found", () => {
  it("has its own title instead of inheriting the home page's", () => {
    expect(metadata.title).toBe("Page not found");
  });

  it("names the page in its one h1 and links the main sections", () => {
    render(<NotFound />);

    expect(screen.getAllByRole("heading", { level: 1 }).map(heading => heading.textContent)).toEqual([
      "Page not found",
    ]);
    expect(screen.getAllByRole("link").map(link => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Go to the home page", "/"],
      ["Open the dashboard", "/aave"],
      ["Read the blog", "/blog"],
    ]);
  });

  it("makes the home page link the one pink action and keeps the code in a kicker above the heading", () => {
    render(<NotFound />);
    const links = screen.getAllByRole("link");

    expect(links.map(link => link.className.includes("btn-primary"))).toEqual([true, false, false]);
    expect(screen.getByRole("heading", { level: 1 }).previousElementSibling?.textContent).toBe("Error 404");
  });
});

// A URL that matches no route cannot tell its language: the message comes in English, then in Czech.
describe("global-not-found", () => {
  it("keeps the English title on the English document", () => {
    expect(globalMetadata.title).toBe("Page not found");
  });

  it("says it in English with the one h1 and the one pink link, then in Czech under lang=cs", () => {
    const { container } = render(<GlobalNotFound />);
    const czech = container.querySelector('[lang="cs"]') as HTMLElement;

    expect(screen.getAllByRole("heading", { level: 1 }).map(heading => heading.textContent)).toEqual([
      "Page not found",
    ]);
    expect(within(czech).getByRole("heading", { level: 2 }).textContent).toBe("Stránka nenalezena");
    expect(within(czech).getByText("Chyba 404")).toBeTruthy();
    expect(within(czech).getByText("Stránka, kterou hledáte, neexistuje.")).toBeTruthy();
    expect(czech.contains(screen.getByRole("heading", { level: 1 }))).toBe(false);

    const links = screen.getAllByRole("link");
    expect(links.map(link => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Go to the home page", "/"],
      ["Open the dashboard", "/aave"],
      ["Read the blog", "/blog"],
      ["Přejít na úvodní stránku", "/cz"],
      ["Otevřít přehled", "/cz/aave"],
      ["Číst blog", "/cz/blog"],
    ]);
    expect(links.map(link => link.className.includes("btn-primary"))).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(within(czech).getAllByRole("link")).toHaveLength(3);
  });

  it("names the two link lists apart and uses no em or en dash", () => {
    const { container } = render(<GlobalNotFound />);

    expect(screen.getByRole("navigation", { name: "Pages" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Stránky" })).toBeTruthy();
    expect(container.innerHTML).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
  });
});
