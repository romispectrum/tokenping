// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageSwitch } from "~~/components/ui/LanguageSwitch";
import { LocaleProvider } from "~~/i18n/LocaleProvider";

const state = vi.hoisted(() => ({ pathname: "/blog/aave-health-factor" }));
vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));

const languageLinks = () => screen.getAllByRole("link").map(link => [link.textContent, link.getAttribute("href")]);

describe("LanguageSwitch", () => {
  it("is a closed menu whose button names the control and the current language", () => {
    const { container } = render(<LanguageSwitch />);
    const details = container.querySelector("details");
    const summary = container.querySelector("summary");

    expect(details?.open).toBe(false);
    expect(summary?.getAttribute("aria-label")).toBe("Language: English");
    expect(summary?.textContent).toBe("EN");
  });

  it("lists every language as a link to this page in that language, by label, every English entry marked", () => {
    state.pathname = "/blog/aave-health-factor";
    render(<LanguageSwitch />);
    const links = screen.getAllByRole("link");
    const entry = (name: string) => screen.getByRole("link", { name });

    expect(languageLinks()).toEqual([
      ["Deutsch (Österreich)AT", "/de/blog/aave-health-factor-erklaert"],
      ["Deutsch (Schweiz)CH", "/de/blog/aave-health-factor-erklaert"],
      ["ČeštinaCZ", "/cz/blog/aave-health-factor-vysvetleni"],
      ["Deutsch (Deutschland)DE", "/de/blog/aave-health-factor-erklaert"],
      ["EspañolES", "/es/blog/factor-de-salud-aave"],
      ["FrançaisFR", "/fr/blog/facteur-de-sante-aave"],
      ["हिन्दीHI", "/hi/blog/aave-health-factor-kya-hai"],
      ["ItalianoIT", "/it/blog/fattore-di-salute-aave"],
      ["PortuguêsPT", "/pt/blog/fator-de-saude-aave"],
      ["English (UK)UK", "/blog/aave-health-factor"],
      ["English (US)US", "/blog/aave-health-factor"],
      ["Tiếng ViệtVI", "/vi/blog/he-so-suc-khoe-aave"],
    ]);
    // Both English entries are this page; nothing else is.
    expect(links.filter(link => link.getAttribute("aria-current") === "true")).toEqual([
      entry("English (UK)"),
      entry("English (US)"),
    ]);
    // Each entry is spoken in its language and names the page's language for that region.
    expect(entry("English (UK)").getAttribute("hreflang")).toBe("en-GB");
    expect(entry("Deutsch (Österreich)").getAttribute("lang")).toBe("de-AT");
    expect(entry("Čeština").getAttribute("lang")).toBe("cs");
    expect(entry("Čeština").getAttribute("hreflang")).toBe("cs");
    expect(entry("हिन्दी").getAttribute("hreflang")).toBe("hi");
    expect(entry("Tiếng Việt").getAttribute("lang")).toBe("vi");
    // The short codes and the check are decoration: the options are named by the language alone.
    expect(entry("Español")).toBe(links[4]);
  });

  it("closes on Escape and puts focus back on the button", () => {
    const { container } = render(<LanguageSwitch />);
    const details = container.querySelector("details") as HTMLDetailsElement;
    const summary = container.querySelector("summary") as HTMLElement;
    details.setAttribute("open", "");

    fireEvent.keyDown(details, { key: "Escape" });

    expect(details.open).toBe(false);
    expect(document.activeElement).toBe(summary);
  });

  it("closes on a click outside", () => {
    const { container } = render(
      <>
        <button type="button">elsewhere</button>
        <LanguageSwitch />
      </>,
    );
    const details = container.querySelector("details") as HTMLDetailsElement;
    details.setAttribute("open", "");

    fireEvent.click(screen.getByRole("button", { name: "elsewhere" }));

    expect(details.open).toBe(false);
  });

  it("speaks Czech on a Czech page and links back to the English page", () => {
    state.pathname = "/cz/blog/aave-health-factor-vysvetleni";
    const { container } = render(
      <LocaleProvider locale="cs">
        <LanguageSwitch />
      </LocaleProvider>,
    );

    expect(container.querySelector("summary")?.getAttribute("aria-label")).toBe("Jazyk: Čeština");
    expect(container.querySelector("summary")?.textContent).toBe("CZ");
    expect(screen.getByRole("link", { name: "English (US)" }).getAttribute("href")).toBe("/blog/aave-health-factor");
    expect(screen.getByRole("link", { name: "Čeština" }).getAttribute("aria-current")).toBe("true");
    expect(container.innerHTML).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
  });
});
