const PAGE_SIZE = 1000;

type PageResult<T> = { data: T[] | null; error: { message: string } | null };

/**
 * Reads every row of a select in ranges of up to 1000 rows, stopping at the first empty page or error. A short page
 * does not end the read: the server's max_rows can be set below 1000, so each range starts after the rows actually
 * returned, at the cost of one extra (empty) request. `selectPage` must order by a unique column, or consecutive
 * ranges can skip or repeat rows.
 */
export async function selectAllPages<T>(
  selectPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<{ data: T[]; error: null } | { data: null; error: { message: string } }> {
  const rows: T[] = [];
  for (;;) {
    const { data, error } = await selectPage(rows.length, rows.length + PAGE_SIZE - 1);
    if (error) return { data: null, error };
    if (!data?.length) return { data: rows, error: null };
    rows.push(...data);
  }
}
