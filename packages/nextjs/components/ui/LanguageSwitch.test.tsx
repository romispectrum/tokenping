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

  it("lists every language as a link to this page in that language, the current one marked", () => {
    state.pathname = "/blog/aave-health-factor";
    render(<LanguageSwitch />);

    expect(languageLinks()).toEqual([
      ["EnglishEN", "/blog/aave-health-factor"],
      ["ČeštinaCZ", "/cz/blog/aave-health-factor-vysvetleni"],
      ["EspañolES", "/es/blog/factor-de-salud-aave"],
      ["हिन्दीHI", "/hi/blog/aave-health-factor-kya-hai"],
      ["DeutschDE", "/de/blog/aave-health-factor-erklaert"],
      ["Tiếng ViệtVI", "/vi/blog/he-so-suc-khoe-aave"],
    ]);
    const [english, czech, spanish, hindi, german, vietnamese] = screen.getAllByRole("link");
    expect(english.getAttribute("aria-current")).toBe("true");
    expect(czech.getAttribute("aria-current")).toBeNull();
    expect(czech.getAttribute("lang")).toBe("cs");
    expect(czech.getAttribute("hreflang")).toBe("cs");
    expect(spanish.getAttribute("lang")).toBe("es");
    expect(spanish.getAttribute("hreflang")).toBe("es");
    expect(hindi.getAttribute("lang")).toBe("hi");
    expect(hindi.getAttribute("hreflang")).toBe("hi");
    expect(german.getAttribute("hreflang")).toBe("de");
    expect(vietnamese.getAttribute("lang")).toBe("vi");
    // The short codes and the check are decoration: the options are named by the language alone.
    expect(screen.getByRole("link", { name: "English" })).toBe(english);
    expect(screen.getByRole("link", { name: "Čeština" })).toBe(czech);
    expect(screen.getByRole("link", { name: "Español" })).toBe(spanish);
    expect(screen.getByRole("link", { name: "हिन्दी" })).toBe(hindi);
    expect(screen.getByRole("link", { name: "Deutsch" })).toBe(german);
    expect(screen.getByRole("link", { name: "Tiếng Việt" })).toBe(vietnamese);
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
    expect(screen.getByRole("link", { name: "English" }).getAttribute("href")).toBe("/blog/aave-health-factor");
    expect(screen.getByRole("link", { name: "Čeština" }).getAttribute("aria-current")).toBe("true");
    expect(container.innerHTML).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
  });
});
