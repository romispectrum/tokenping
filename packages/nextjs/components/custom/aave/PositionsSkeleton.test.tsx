import { describe, expect, it } from "vitest";
import { PositionsSkeleton } from "~~/components/custom/aave/PositionsSkeleton";
import { renderMarkup } from "~~/utils/testing/render";

describe("PositionsSkeleton", () => {
  it("renders four placeholder cards in a single column", () => {
    expect(renderMarkup(<PositionsSkeleton columns={1} />)).toMatchSnapshot();
  });

  it("renders four placeholder cards in two columns from lg", () => {
    const html = renderMarkup(<PositionsSkeleton columns={2} />);

    expect(html.startsWith('<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">')).toBe(true);
    expect(html).toMatchSnapshot();
  });
});
