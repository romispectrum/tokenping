// @vitest-environment jsdom
import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NotFound, { metadata } from "~~/app/(en)/not-found";
import GlobalNotFound, { metadata as globalMetadata } from "~~/app/global-not-found";
import { LOCALES, LOCALE_INFO } from "~~/i18n/locales";
import { routePath } from "~~/i18n/routes";

// The global 404 brings its own <html> document (fonts, providers); only the page inside it is under test here.
vi.mock("~~/components/RootDocument", () => ({
  rootDocument: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("~~/i18n/client/en", () => ({ LocaleRoot: ({ children }: { children: ReactNode }) => <>{children}</> }));

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

// A URL that matches no route cannot tell its language: the message comes in English, then a link to every other
// language's home page.
describe("global-not-found", () => {
  it("keeps the English title on the English document", () => {
    expect(globalMetadata.title).toBe("Page not found");
  });

  it("says it in English with the one h1 and the one pink link, then links every other language's home page", () => {
    render(<GlobalNotFound />);

    expect(screen.getAllByRole("heading", { level: 1 }).map(heading => heading.textContent)).toEqual([
      "Page not found",
    ]);
    const languages = screen.getByRole("navigation", { name: "Language" });
    expect(
      within(languages)
        .getAllByRole("link")
        .map(link => [link.textContent, link.getAttribute("href"), link.getAttribute("lang")]),
    ).toEqual(
      LOCALES.filter(locale => locale !== "en").map(locale => [
        LOCALE_INFO[locale].name,
        routePath(locale, "home"),
        LOCALE_INFO[locale].htmlLang,
      ]),
    );
    const links = screen.getAllByRole("link");
    expect(links.filter(link => link.className.includes("btn-primary")).map(link => link.textContent)).toEqual([
      "Go to the home page",
    ]);
  });

  it("names the two link lists apart and uses no em or en dash", () => {
    const { container } = render(<GlobalNotFound />);

    expect(screen.getByRole("navigation", { name: "Pages" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Language" })).toBeTruthy();
    expect(container.innerHTML).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
  });
});
