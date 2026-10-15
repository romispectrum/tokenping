// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BADGE_VARIANTS, Badge, type BadgeVariant, badgeClasses } from "~~/components/ui/Badge";

describe("Badge", () => {
  it("is a neutral pill by default", () => {
    render(<Badge>Draft</Badge>);
    const badge = screen.getByText("Draft");

    expect(badge.tagName).toBe("SPAN");
    expect(badge.getAttribute("data-variant")).toBe("neutral");
    expect(badge.className).toContain("badge h-6");
    expect(badge.className).toContain("rounded-full");
    expect(badge.className).toContain(BADGE_VARIANTS.neutral);
  });

  it.each(Object.keys(BADGE_VARIANTS) as BadgeVariant[])("applies the %s variant", variant => {
    render(<Badge variant={variant}>Label</Badge>);

    expect(screen.getByText("Label").className).toContain(BADGE_VARIANTS[variant]);
  });

  // Status colours are status only and the pink badge is the one brand moment: never pink for status.
  it("keeps status variants on their subtle status tints and only brand is bold uppercase", () => {
    for (const status of ["success", "warning", "info", "destructive"] as const) {
      expect(BADGE_VARIANTS[status]).toContain(`bg-${status}-subtle text-${status}`);
      expect(BADGE_VARIANTS[status]).not.toMatch(/primary|pink/);
    }
    for (const variant of Object.keys(BADGE_VARIANTS) as BadgeVariant[]) {
      expect(BADGE_VARIANTS[variant].includes("uppercase"), variant).toBe(variant === "brand");
    }
  });

  it("adds a decorative status dot", () => {
    render(
      <Badge variant="success" dot>
        Active
      </Badge>,
    );
    const dot = screen.getByText("Active").querySelector("span");

    expect(dot?.getAttribute("aria-hidden")).toBe("true");
    expect(dot?.className).toContain("bg-current");
  });

  it("styles a link as a badge", () => {
    expect(badgeClasses({ variant: "brand", className: "ml-2" })).toMatch(/^badge .* ml-2$/);
  });
});
