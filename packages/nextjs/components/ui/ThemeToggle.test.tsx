// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { THEME_COLOR } from "~~/components/brand/themeColor";
import { ThemeChoice } from "~~/components/ui/ThemeChoice";
import { ThemeToggle } from "~~/components/ui/ThemeToggle";
import { LocaleProvider } from "~~/i18n/LocaleProvider";

// jsdom has no matchMedia, which next-themes reads for the System theme; the OS here prefers light.
const stubMatchMedia = () => {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
};

const renderWithTheme = (ui: React.ReactNode) =>
  render(
    <ThemeProvider attribute={["class", "data-theme"]} defaultTheme="light" enableSystem disableTransitionOnChange>
      {ui}
    </ThemeProvider>,
  );

describe("ThemeToggle", () => {
  let meta: HTMLMetaElement;

  beforeEach(() => {
    stubMatchMedia();
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
    meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = THEME_COLOR.light;
    document.head.appendChild(meta);
  });

  afterEach(() => meta.remove());

  it("is a labelled 40px button, 44px on touch, with both icons hidden from assistive technology", () => {
    renderWithTheme(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "Toggle light or dark theme" });

    expect(button.getAttribute("type")).toBe("button");
    expect(button.className).toContain("size-10");
    expect(button.className).toContain("pointer-coarse:min-h-11 pointer-coarse:min-w-11");
    expect(button.className).toContain("hover:bg-accent");
    expect([...button.querySelectorAll("svg")].map(svg => svg.getAttribute("aria-hidden"))).toEqual(["true", "true"]);
  });

  // dark: also matches inside a dark band (a dark footer on a light page); the icon reports the theme on <html>.
  it("picks its icon from the theme on <html>, not from a dark band around it", () => {
    renderWithTheme(<ThemeToggle />);
    const icons = [...screen.getByRole("button").querySelectorAll("svg")].map(svg => svg.getAttribute("class"));

    expect(icons[0]).toContain("theme-dark:hidden");
    expect(icons[1]).toContain("hidden size-4 theme-dark:block");
    expect(icons.join(" ")).not.toMatch(/(^|\s)dark:/);
  });

  it("starts light and switches the class, data-theme and the browser colour to dark and back", async () => {
    renderWithTheme(<ThemeToggle />);
    const root = document.documentElement;

    expect(root.classList.contains("light")).toBe(true);
    expect(root.getAttribute("data-theme")).toBe("light");

    await act(async () => fireEvent.click(screen.getByRole("button")));
    expect(root.classList.contains("dark")).toBe(true);
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(meta.content).toBe(THEME_COLOR.dark);

    await act(async () => fireEvent.click(screen.getByRole("button")));
    expect(root.classList.contains("dark")).toBe(false);
    expect(root.getAttribute("data-theme")).toBe("light");
    expect(meta.content).toBe(THEME_COLOR.light);
  });
});

describe("ThemeChoice", () => {
  beforeEach(() => {
    stubMatchMedia();
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
  });

  it("offers Light, Dark and System as a named radio group, starting on Light", () => {
    renderWithTheme(<ThemeChoice />);
    const group = screen.getByRole("group", { name: "Theme" });
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];

    expect(group.contains(radios[0])).toBe(true);
    expect(radios.map(radio => radio.value)).toEqual(["light", "dark", "system"]);
    expect(screen.getByRole("radio", { name: "Light" })).toHaveProperty("checked", true);
    expect(new Set(radios.map(radio => radio.name)).size).toBe(1);
  });

  it("stores the choice: Dark switches the page, System follows the OS (light here)", async () => {
    renderWithTheme(<ThemeChoice />);
    const root = document.documentElement;

    await act(async () => fireEvent.click(screen.getByRole("radio", { name: "Dark" })));
    expect(root.classList.contains("dark")).toBe(true);
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(screen.getByRole("radio", { name: "Dark" })).toHaveProperty("checked", true);

    await act(async () => fireEvent.click(screen.getByRole("radio", { name: "System" })));
    expect(localStorage.getItem("theme")).toBe("system");
    expect(root.classList.contains("dark")).toBe(false);
    expect(screen.getByRole("radio", { name: "System" })).toHaveProperty("checked", true);
  });

  it("marks the chosen option with the page colour and the --input boundary, never pink", () => {
    renderWithTheme(<ThemeChoice />);
    const option = screen.getByRole("radio", { name: "Light" }).closest("label") as HTMLLabelElement;

    expect(option.className).toContain("has-checked:border-input has-checked:bg-background");
    expect(option.className).toContain("pointer-coarse:min-h-11");
    expect(option.className).not.toMatch(/primary|pink/);
  });
});

describe("Theme controls in Czech", () => {
  beforeEach(() => {
    stubMatchMedia();
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
  });

  it("names the toggle and the Light, Dark and System options in Czech", async () => {
    renderWithTheme(
      <LocaleProvider locale="cs">
        <ThemeToggle />
        <ThemeChoice />
      </LocaleProvider>,
    );

    expect(screen.getByRole("button", { name: "Přepnout světlý nebo tmavý motiv" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Motiv" })).toBeTruthy();
    expect((screen.getAllByRole("radio") as HTMLInputElement[]).map(radio => radio.value)).toEqual([
      "light",
      "dark",
      "system",
    ]);
    for (const name of ["Světlý", "Tmavý", "Systém"]) expect(screen.getByRole("radio", { name })).toBeTruthy();

    await act(async () => fireEvent.click(screen.getByRole("radio", { name: "Tmavý" })));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
