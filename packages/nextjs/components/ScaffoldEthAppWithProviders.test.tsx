// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ScaffoldEthApp } from "~~/components/ScaffoldEthAppWithProviders";

// The frame's own markup only: the strip, header and footer have their own tests.
vi.mock("~~/components/BetaBanner", () => ({
  BetaBanner: () => (
    <a href="#main" data-stub="beta-banner">
      Skip to content
    </a>
  ),
}));
vi.mock("~~/components/Header", () => ({ Header: () => <header data-stub="header" /> }));
vi.mock("~~/components/Footer", () => ({ Footer: () => <footer data-stub="footer" /> }));
vi.mock("react-hot-toast", () => ({ Toaster: () => null }));
vi.mock("~~/components/scaffold-eth", () => ({ BlockieAvatar: () => null }));
vi.mock("~~/services/web3/wagmiConfig", () => ({ wagmiConfig: {} }));

describe("ScaffoldEthApp", () => {
  it("gives the skip link a focusable main landmark to land on", () => {
    const { container } = render(
      <ScaffoldEthApp>
        <h1>Page</h1>
      </ScaffoldEthApp>,
    );

    const main = container.querySelector("main");
    expect(main?.id).toBe("main");
    expect(main?.tabIndex).toBe(-1);
    expect(main?.textContent).toBe("Page");
    expect(container.querySelector('a[href="#main"]')).not.toBeNull();
  });

  it("renders the beta strip, which holds the skip link, before the header", () => {
    const { container } = render(<ScaffoldEthApp>content</ScaffoldEthApp>);

    const order = Array.from(container.querySelectorAll("[data-stub]")).map(element =>
      element.getAttribute("data-stub"),
    );
    expect(order).toEqual(["beta-banner", "header", "footer"]);
  });
});
