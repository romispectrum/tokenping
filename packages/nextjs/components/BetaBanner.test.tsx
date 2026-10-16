// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BetaBanner } from "~~/components/BetaBanner";
import { LocaleProvider } from "~~/i18n/LocaleProvider";
import { renderMarkup } from "~~/utils/testing/render";

describe("BetaBanner", () => {
  it("renders the beta notice with the X link", () => {
    expect(renderMarkup(<BetaBanner />)).toMatchSnapshot();
  });

  it("is a labelled region and leaves the banner landmark to the site header", () => {
    render(<BetaBanner />);

    expect(screen.queryByRole("banner")).toBeNull();
    expect(screen.getByRole("region", { name: "App status and social" }).textContent).toContain("Tokenping is in beta");
  });

  it("starts with the skip link to the main content, outside the strip's region", () => {
    const { container } = render(<BetaBanner />);
    const [first] = container.querySelectorAll("a, button");

    expect(first.textContent).toBe("Skip to content");
    expect(first.getAttribute("href")).toBe("#main");
    expect(first.closest("section")).toBeNull();
  });

  it("keeps the visible words in the X link's name", () => {
    render(<BetaBanner />);
    const link = screen.getByRole("link", { name: "Follow us on X" });

    expect(link.textContent).toBe("Follow us on");
  });

  it("opens the X account in a new tab without opener or referrer", () => {
    render(<BetaBanner />);
    const link = screen.getByRole("link", { name: "Follow us on X" });

    expect(link.getAttribute("href")).toBe("https://x.com/tokenping");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });
});

describe("BetaBanner in Czech", () => {
  const renderCzech = () =>
    render(
      <LocaleProvider locale="cs">
        <BetaBanner />
      </LocaleProvider>,
    );

  it("says the skip link, the beta status and the X link in Czech", () => {
    const { container } = renderCzech();
    const [first] = container.querySelectorAll("a, button");

    expect(first.textContent).toBe("Přeskočit na obsah");
    expect(first.getAttribute("href")).toBe("#main");
    expect(screen.getByRole("region", { name: "Stav aplikace a sociální sítě" }).textContent).toContain(
      "Tokenping je v betaverzi",
    );
    const link = screen.getByRole("link", { name: "Sledujte nás na X" });
    expect(link.textContent).toBe("Sledujte nás na");
    expect(link.getAttribute("href")).toBe("https://x.com/tokenping");
    expect(container.innerHTML).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
  });
});
