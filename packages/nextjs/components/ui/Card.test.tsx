// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~~/components/ui/Card";

describe("Card", () => {
  it("is the flat canonical card: 18px radius, hairline border, bg-card, no shadow", () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId("card");

    expect(card.className).toContain("card group/card");
    expect(card.className).toContain("rounded-2xl border border-border bg-card");
    expect(card.className).not.toContain("shadow");
    expect(card.getAttribute("data-size")).toBe("default");
  });

  it("adds the card shadow for marketing pages", () => {
    render(
      <Card data-testid="card" marketing>
        Content
      </Card>,
    );

    expect(screen.getByTestId("card").className).toContain("shadow-card");
  });

  it("tightens the padding with size sm", () => {
    render(
      <Card data-testid="card" size="sm">
        Content
      </Card>,
    );

    expect(screen.getByTestId("card").className).toContain("[--card-spacing:1rem]");
  });

  it("composes header, title, description, content and footer", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Alert threshold</CardTitle>
          <CardDescription>We email you below this health factor.</CardDescription>
        </CardHeader>
        <CardContent>1.5</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );

    expect(screen.getByRole("heading", { level: 3, name: "Alert threshold" }).className).toContain("font-medium");
    expect(screen.getByText("We email you below this health factor.").className).toContain("text-muted-foreground");
    expect(screen.getByText("Footer").getAttribute("data-slot")).toBe("card-footer");
  });

  it("renders the title at the level the page outline needs", () => {
    render(<CardTitle as="h2">Positions</CardTitle>);

    expect(screen.getByRole("heading", { level: 2, name: "Positions" })).toBeTruthy();
  });
});
