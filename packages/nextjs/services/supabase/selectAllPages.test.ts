import { describe, expect, it, vi } from "vitest";
import { selectAllPages } from "~~/services/supabase/selectAllPages";

describe("selectAllPages", () => {
  const rows = (from: number, count: number) => Array.from({ length: count }, (_, i) => from + i);

  /** A table of `total` rows served like PostgREST: the requested range, cut to at most `maxRows` rows. */
  const table = (total: number, maxRows = 1000) =>
    vi.fn(async (from: number, to: number) => ({
      data: rows(from, Math.max(0, Math.min(to + 1, from + maxRows, total) - from)),
      error: null,
    }));

  it("requests 1000-row ranges, each starting where the last one ended, until an empty page", async () => {
    const selectPage = table(2005);

    const result = await selectAllPages(selectPage);

    expect(selectPage.mock.calls).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
      [2005, 3004],
    ]);
    expect(result).toStrictEqual({ data: rows(0, 2005), error: null });
  });

  it("reads every row when a server max_rows below 1000 cuts every page short", async () => {
    const selectPage = table(1234, 500);

    const result = await selectAllPages(selectPage);

    expect(selectPage.mock.calls).toEqual([
      [0, 999],
      [500, 1499],
      [1000, 1999],
      [1234, 2233],
    ]);
    expect(result).toStrictEqual({ data: rows(0, 1234), error: null });
  });

  it.each([
    ["an empty page", []],
    ["null data", null],
  ])("stops after the first request for %s", async (_label, data) => {
    const selectPage = vi.fn(async () => ({ data, error: null }));
    expect(await selectAllPages(selectPage)).toStrictEqual({ data: [], error: null });
    expect(selectPage).toHaveBeenCalledOnce();
  });

  it("returns the first error and drops the rows read so far", async () => {
    const selectPage = vi.fn(async (from: number) =>
      from === 0 ? { data: rows(0, 1000), error: null } : { data: null, error: { message: "timeout" } },
    );
    expect(await selectAllPages(selectPage)).toStrictEqual({ data: null, error: { message: "timeout" } });
    expect(selectPage).toHaveBeenCalledTimes(2);
  });
});
