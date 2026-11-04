// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound, { generateMetadata } from "~~/app/(intl)/[lang]/not-found";
import { LocaleProvider } from "~~/i18n/LocaleProvider";
import { langParams } from "~~/utils/testing/langParams";

// The layout mounts the language's client root; the 404 reads its language and strings from it.
const renderNotFound = () =>
  render(
    <LocaleProvider locale="cs">
      <NotFound />
    </LocaleProvider>,
  );

describe("/cz not-found", () => {
  it("has a Czech title, and the English one under a segment that names no language", async () => {
    expect((await generateMetadata(langParams("cz"))).title).toBe("Stránka nenalezena");
    expect((await generateMetadata(langParams("xx"))).title).toBe("Page not found");
  });

  it("names the page in Czech in its one h1 and links the Czech sections", () => {
    renderNotFound();

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
    const { container } = renderNotFound();
    const links = screen.getAllByRole("link");

    expect(links.map(link => link.className.includes("btn-primary"))).toEqual([true, false, false]);
    expect(screen.getByRole("heading", { level: 1 }).previousElementSibling?.textContent).toBe("Chyba 404");
    expect(container.innerHTML).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
  });
});
