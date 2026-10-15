// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandDivider } from "~~/components/ui/BrandDivider";
import { Glow, GlowWash } from "~~/components/ui/Glow";
import { GrainCard } from "~~/components/ui/GrainCard";
import { Kicker } from "~~/components/ui/Kicker";
import { SectionHeader } from "~~/components/ui/SectionHeader";

describe("Kicker", () => {
  it("is a paragraph with the kicker utility, 12px above the heading", () => {
    render(<Kicker>How it works</Kicker>);
    const kicker = screen.getByText("How it works");

    expect(kicker.tagName).toBe("P");
    expect(kicker.className).toBe("kicker mt-0 mb-3");
  });
});

describe("SectionHeader", () => {
  it("renders the kicker, a section heading and the lead, centred", () => {
    render(<SectionHeader id="faq" kicker="Questions" title="What people ask" lead="Short answers first." />);
    const heading = screen.getByRole("heading", { level: 2, name: "What people ask" });

    expect(heading.id).toBe("faq");
    expect(heading.className).toContain("text-section");
    expect(screen.getByText("Questions").className).toContain("kicker");
    expect(screen.getByText("Short answers first.").className).toContain("text-lead");
    expect(heading.closest("header")?.className).toContain("text-center");
  });

  it("renders a hero heading and aligns to the start", () => {
    render(<SectionHeader as="h1" align="start" title="Aave health factor alerts" />);
    const heading = screen.getByRole("heading", { level: 1 });

    expect(heading.className).toContain("text-display");
    expect(heading.closest("header")?.className).not.toContain("text-center");
  });
});

describe("marketing effects", () => {
  it("renders the grain glass card with its light and dark surfaces", () => {
    render(<GrainCard data-testid="glass">Hero</GrainCard>);
    const card = screen.getByTestId("glass");

    expect(card.className).toContain("grain relative rounded-3xl");
    expect(card.className).toContain("shadow-frame backdrop-blur-xs");
    expect(card.className).toContain("dark:bg-card/70");
  });

  it("renders the glow as decoration behind the content", () => {
    const { container } = render(<Glow />);
    const layer = container.firstElementChild as HTMLElement;

    expect(layer.getAttribute("aria-hidden")).toBe("true");
    expect(layer.className).toContain("pointer-events-none absolute inset-0 -z-10");
    expect(layer.style.maskImage).toContain("linear-gradient");
    expect(layer.firstElementChild?.className).toContain("from-brand-pink to-brand-violet");
  });

  it("does not fade the centred glow", () => {
    const { container } = render(<Glow placement="center" />);

    expect((container.firstElementChild as HTMLElement).style.maskImage).toBe("");
  });

  it("builds the dark band wash from the brand variables", () => {
    const { container } = render(<GlowWash />);
    const wash = container.firstElementChild as HTMLElement;

    expect(wash.getAttribute("aria-hidden")).toBe("true");
    expect(wash.style.backgroundImage).toContain("var(--brand-pink)");
  });

  it("renders the brand divider as decoration", () => {
    const { container } = render(<BrandDivider />);
    const divider = container.firstElementChild as HTMLElement;

    expect(divider.getAttribute("aria-hidden")).toBe("true");
    expect(divider.className).toBe("divider-brand print:hidden");
  });
});
