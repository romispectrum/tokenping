// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BetaBanner, SkipLink } from "~~/components/BetaBanner";
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

  it("is fixed to the right edge, halfway down, in vertical writing, under the header's layer", () => {
    render(<BetaBanner />);
    const region = screen.getByRole("region", { name: "App status and social" });

    expect(region.className).toContain("fixed");
    expect(region.className).toContain("right-0");
    expect(region.className).toContain("top-1/2");
    expect(region.className).toContain("-translate-y-1/2");
    expect(region.className).toContain("z-30");
    expect(region.firstElementChild?.className).toContain("[writing-mode:vertical-rl]");
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

describe("SkipLink", () => {
  it("links to the main content and is not inside a region", () => {
    const { container } = render(<SkipLink />);
    const [first] = container.querySelectorAll("a, button");

    expect(first.textContent).toBe("Skip to content");
    expect(first.getAttribute("href")).toBe("#main");
    expect(first.closest("section")).toBeNull();
  });
});

describe("BetaBanner in Czech", () => {
  it("says the skip link, the beta status and the X link in Czech", () => {
    const { container } = render(
      <LocaleProvider locale="cs">
        <SkipLink />
        <BetaBanner />
      </LocaleProvider>,
    );
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
