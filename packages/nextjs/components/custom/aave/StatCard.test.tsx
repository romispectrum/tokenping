import { describe, expect, it } from "vitest";
import { STAT_STRIP_CLASS_NAME, StatCard, StatCardSkeleton } from "~~/components/custom/aave/StatCard";
import { LocaleProvider } from "~~/i18n/LocaleProvider";
import { renderMarkup } from "~~/utils/testing/render";

describe("StatCard", () => {
  it("renders a key number as a dt/dd pair in Satoshi Bold with tabular figures", () => {
    const html = renderMarkup(
      <dl>
        <StatCard label="Total supplied" value="$13.15K" />
      </dl>,
    );

    expect(html).toContain('<dt class="text-sm font-medium text-muted-foreground">Total supplied</dt>');
    expect(html).toContain('<dd class="m-0 font-bold tabular-nums text-lg tracking-tight sm:text-2xl">$13.15K</dd>');
    expect(html).not.toMatch(/shadow|bg-primary|font-data/);
  });

  // Three numbers in one strip: label-value rows on a phone, three columns from sm. A cell draws no border of its own,
  // the strip draws one around all three.
  it("draws a cell without a border, for the bordered strip", () => {
    const html = renderMarkup(
      <dl className={STAT_STRIP_CLASS_NAME}>
        <StatCard label="Net worth" value="$11.00K" />
      </dl>,
    );

    expect(html).toContain(
      '<dl class="m-0 grid grid-cols-1 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">',
    );
    expect(html).toMatch(
      /<div class="flex min-w-0 items-baseline justify-between gap-3 sm:flex-col sm:items-start sm:gap-1 px-4 py-2.5 text-card-foreground sm:px-5 sm:py-4">/,
    );
  });

  it("reads No data, never 0, when the number is not known", () => {
    const html = renderMarkup(
      <dl>
        <StatCard label="Debt" value={null} variant="panel" />
      </dl>,
    );

    expect(html).toContain('<dd class="m-0 text-sm text-muted-foreground">No data</dd>');
    expect(html).toContain("rounded-xl bg-muted px-3 py-2 sm:p-4");
  });

  it("keeps the panel placeholder visible by outlining it instead of muting it", () => {
    const html = renderMarkup(<StatCardSkeleton variant="panel" />);

    expect(html).toContain("rounded-xl border border-border px-3 py-2 sm:p-4");
    expect(html).not.toContain("rounded-xl bg-muted");
  });
});

describe("StatCard in Czech", () => {
  it("says a missing number has no data, in Czech", () => {
    const html = renderMarkup(
      <LocaleProvider locale="cs">
        <dl>
          <StatCard label="Čisté jmění" value={null} />
        </dl>
      </LocaleProvider>,
    );

    expect(html).toContain(">Žádná data</dd>");
  });
});
