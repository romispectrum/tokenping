// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Breadcrumbs } from "~~/components/seo/Breadcrumbs";

describe("Breadcrumbs", () => {
  it("renders a labelled trail with links up the hierarchy and the current page last", () => {
    render(<Breadcrumbs crumbs={[{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: "Post" }]} />);

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const items = within(nav).getAllByRole("listitem");

    expect(items.map(item => item.textContent)).toEqual(["Home", "Blog", "Post"]);
    expect(within(nav).getByRole("link", { name: "Home" }).getAttribute("href")).toBe("/");
    expect(within(nav).getByRole("link", { name: "Blog" }).getAttribute("href")).toBe("/blog");
    expect(within(nav).queryByRole("link", { name: "Post" })).toBeNull();
    expect(within(items[2]).getByText("Post").closest("[aria-current]")?.getAttribute("aria-current")).toBe("page");
  });

  it("does not link the current page even when it has a path", () => {
    render(
      <Breadcrumbs
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ]}
      />,
    );

    expect(screen.queryByRole("link", { name: "Blog" })).toBeNull();
    expect(screen.getByText("Blog").closest("[aria-current]")?.getAttribute("aria-current")).toBe("page");
  });

  it("names the trail in the page's language", () => {
    render(<Breadcrumbs locale="cs" crumbs={[{ name: "Úvod", path: "/cz" }, { name: "Ochrana soukromí" }]} />);

    const nav = screen.getByRole("navigation", { name: "Drobečková navigace" });
    expect(within(nav).getByRole("link", { name: "Úvod" }).getAttribute("href")).toBe("/cz");
    expect(screen.queryByRole("navigation", { name: "Breadcrumb" })).toBeNull();
  });
});
