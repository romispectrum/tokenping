import { describe, expect, it } from "vitest";
import { StatCard, StatCardSkeleton } from "~~/components/custom/aave/StatCard";
import { renderMarkup } from "~~/utils/testing/render";

describe("StatCard", () => {
  it("renders a key number as a dt/dd pair in Satoshi Bold with tabular figures", () => {
    const html = renderMarkup(
      <dl>
        <StatCard label="Total supplied" value="$13.15K" />
      </dl>,
    );

    expect(html).toContain('<dt class="text-sm font-medium text-muted-foreground">Total supplied</dt>');
    expect(html).toContain('<dd class="m-0 font-bold tabular-nums text-3xl tracking-tight">$13.15K</dd>');
    expect(html).not.toMatch(/shadow|bg-primary|font-data/);
  });

  it("reads No data, never 0, when the number is not known", () => {
    const html = renderMarkup(
      <dl>
        <StatCard label="Debt" value={null} variant="panel" />
      </dl>,
    );

    expect(html).toContain('<dd class="m-0 text-sm text-muted-foreground">No data</dd>');
    expect(html).toContain("rounded-xl bg-muted p-4");
  });

  it("keeps the panel placeholder visible by outlining it instead of muting it", () => {
    const html = renderMarkup(<StatCardSkeleton variant="panel" />);

    expect(html).toContain("rounded-xl border border-border p-4");
    expect(html).not.toContain("rounded-xl bg-muted p-4");
  });
});
