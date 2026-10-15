import { describe, expect, it } from "vitest";
import {
  DashboardSkeleton,
  NetworkListSkeleton,
  PositionDetailsSkeleton,
} from "~~/components/custom/aave/PositionsSkeleton";
import { renderMarkup } from "~~/utils/testing/render";

const count = (html: string, needle: string) => html.split(needle).length - 1;

describe("PositionsSkeleton", () => {
  it("renders four network rows as tall as the real ones, hidden from screen readers", () => {
    const html = renderMarkup(<NetworkListSkeleton />);

    expect(html.startsWith('<div aria-hidden="true"')).toBe(true);
    expect(count(html, "min-h-11")).toBe(4);
    expect(html).toMatchSnapshot();
  });

  it("renders the details card: title, badge, three totals and a token table", () => {
    const html = renderMarkup(<PositionDetailsSkeleton />);

    expect(html).toContain('data-slot="card"');
    expect(count(html, "rounded-xl border border-border p-4")).toBe(3);
    expect(count(html, "h-12")).toBe(3);
    expect(html).toMatchSnapshot();
  });

  it("names the wait once for screen readers while the dashboard has no wallet state yet", () => {
    const html = renderMarkup(<DashboardSkeleton />);

    expect(html.startsWith('<div aria-busy="true"')).toBe(true);
    expect(count(html, 'role="status"')).toBe(1);
    expect(html).toContain(">Loading your dashboard</span>");
    expect(html).toMatchSnapshot();
  });
});
