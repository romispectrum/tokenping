// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound, { metadata } from "~~/app/not-found";

describe("not-found", () => {
  it("has its own title instead of inheriting the home page's", () => {
    expect(metadata.title).toBe("Page not found");
  });

  it("names the page in its one h1 and links the main sections", () => {
    render(<NotFound />);

    expect(screen.getAllByRole("heading", { level: 1 }).map(heading => heading.textContent)).toEqual([
      "Page not found",
    ]);
    expect(screen.getAllByRole("link").map(link => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Go to the home page", "/"],
      ["Open the dashboard", "/aave"],
      ["Read the blog", "/blog"],
    ]);
  });

  it("makes the home page link the one pink action and keeps the code in a kicker above the heading", () => {
    render(<NotFound />);
    const links = screen.getAllByRole("link");

    expect(links.map(link => link.className.includes("btn-primary"))).toEqual([true, false, false]);
    expect(screen.getByRole("heading", { level: 1 }).previousElementSibling?.textContent).toBe("Error 404");
  });
});
