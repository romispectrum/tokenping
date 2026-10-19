import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Test double for the Supabase query builder. Every `from(table)` chain is recorded so tests can pin the exact
 * query sequence and filters; the result is produced by `respond` when the chain is awaited.
 */

export type FakeQueryResult = { data?: unknown; error?: { message: string } | null };

export type RecordedQuery = { table: string; ops: [method: string, ...args: unknown[]][] };

type Responder = (query: RecordedQuery, formatted: string) => FakeQueryResult | undefined;

const CHAIN_METHODS = [
  "select",
  "insert",
  "update",
  "upsert",
  "delete",
  "eq",
  "neq",
  "is",
  "gt",
  "lt",
  "order",
  "range",
];
const TERMINAL_METHODS = ["single", "maybeSingle"];

/** e.g. `notification_configs.select("*").eq("user_id","0xabc").single()` */
export const formatQuery = ({ table, ops }: RecordedQuery) =>
  [table, ...ops.map(([method, ...args]) => `${method}(${args.map(arg => JSON.stringify(arg)).join(",")})`)].join(".");

/** The inclusive `.range(from, to)` of a recorded query, if it has one. */
export const rangeOf = ({ ops }: RecordedQuery): [from: number, to: number] | undefined => {
  const range = ops.find(([method]) => method === "range");
  return range && [Number(range[1]), Number(range[2])];
};

/** The part of `rows` a ranged query reads, as PostgREST serves it (so paginated reads end on an empty page). */
export const sliceByRange = <T>(query: RecordedQuery, rows: readonly T[]) => {
  const [from, to] = rangeOf(query) ?? [0, rows.length - 1];
  return rows.slice(from, to + 1);
};

export const createFakeSupabase = () => {
  const queries: RecordedQuery[] = [];
  let responder: Responder = () => undefined;

  const resultOf = (query: RecordedQuery) => {
    const result = responder(query, formatQuery(query)) ?? {};
    return { data: result.data ?? null, error: result.error ?? null };
  };

  const thenable = (query: RecordedQuery) => ({
    then: <T, E = never>(
      onFulfilled?: (value: { data: unknown; error: { message: string } | null }) => T | PromiseLike<T>,
      onRejected?: (reason: unknown) => E | PromiseLike<E>,
    ) =>
      Promise.resolve()
        .then(() => resultOf(query))
        .then(onFulfilled, onRejected),
  });

  const from = (table: string) => {
    const query: RecordedQuery = { table, ops: [] };
    queries.push(query);
    const builder: Record<string, unknown> = { ...thenable(query) };
    for (const method of CHAIN_METHODS) {
      builder[method] = (...args: unknown[]) => {
        query.ops.push([method, ...args]);
        return builder;
      };
    }
    for (const method of TERMINAL_METHODS) {
      builder[method] = (...args: unknown[]) => {
        query.ops.push([method, ...args]);
        return thenable(query);
      };
    }
    return builder;
  };

  return {
    client: { from } as unknown as SupabaseClient,
    queries,
    /** Formatted queries in execution order. */
    log: () => queries.map(formatQuery),
    respond: (next: Responder) => {
      responder = next;
    },
    /** Answers queries whose formatted form is a key of `results`; anything else gets `{ data: null, error: null }`. */
    respondByQuery: (results: Record<string, FakeQueryResult>) => {
      responder = (_query, formatted) => results[formatted];
    },
    reset: () => {
      queries.length = 0;
      responder = () => undefined;
    },
  };
};

export type FakeSupabase = ReturnType<typeof createFakeSupabase>;

/** Shared instance for `vi.mock("~~/services/supabase/supabaseServer", ...)` factories, which cannot close over test locals. */
export const fakeSupabase = createFakeSupabase();
