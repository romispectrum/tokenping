// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BetaBanner } from "~~/components/BetaBanner";
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
