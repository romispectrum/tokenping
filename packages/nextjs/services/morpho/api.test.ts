import type { Address, Hex } from "viem";
import { describe, expect, it, vi } from "vitest";
import { MorphoApiError, fetchMorphoListing, fetchMorphoPositions } from "~~/services/morpho/api";

const USER = "0x00000000000000000000000000000000000000aa" as Address;
const id = (byte: string) => `0x${byte.repeat(32)}` as Hex;
const PRE = "0x7e2C2561a6b6cbEDe449fB41adFdF4d7ccfD20fE";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const bluePage = (items: unknown[], countTotal = items.length) => ({
  data: { marketPositions: { pageInfo: { countTotal, count: items.length }, items } },
});

const blueItem = (marketId: string, chainId: number, listed = true, preLiquidations: unknown[] = []) => ({
  market: { marketId, listed, chain: { id: chainId }, preLiquidations: { items: preLiquidations } },
});

/** Routes GraphQL calls to `graphql` and Midnight REST calls to `rest`. */
const fakeFetch = (graphql: (body: { variables: Record<string, unknown> }) => unknown, rest: (url: URL) => unknown) =>
  vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname === "/graphql") return json(graphql(JSON.parse(String(init?.body))));
    return json(rest(url));
  });

const noMidnight = () => ({ cursor: null, data: [] });

describe("fetchMorphoPositions", () => {
  it("finds listed Blue positions on the covered chains and skips the rest", async () => {
    const fetchImpl = fakeFetch(
      () =>
        bluePage([
          blueItem(id("ab"), 1, true, [{ address: PRE }, { address: "not an address" }]),
          blueItem(id("cd"), 8453, false),
          // BNB Chain has Morpho, but not among the 14 chains of Morpho's app.
          blueItem(id("ef"), 56),
          blueItem("0x1234", 1),
        ]),
      noMidnight,
    );
    const positions = await fetchMorphoPositions(USER, fetchImpl as typeof fetch);

    expect(positions).toEqual([{ protocol: "morpho-blue", chainId: 1, marketId: id("ab"), preLiquidations: [PRE] }]);
  });

  it("pages through Blue positions by skip and Midnight positions by cursor", async () => {
    const graphql = vi.fn(({ variables }: { variables: Record<string, unknown> }) =>
      variables.skip === 0
        ? bluePage(
            Array.from({ length: 100 }, () => blueItem(id("ab"), 1)),
            101,
          )
        : bluePage([blueItem(id("cd"), 1)], 101),
    );
    const rest = vi.fn((url: URL) =>
      url.searchParams.get("cursor")
        ? { cursor: null, data: [{ chain_id: 8453, market_id: id("ef"), type: "borrow", debt: "5" }] }
        : {
            cursor: "next",
            data: [
              { chain_id: 1, market_id: id("01"), type: "borrow", debt: "7" },
              { chain_id: 1, market_id: id("02"), type: "borrow", debt: "0" },
              // Tempo has Midnight, but Morpho's API cannot say which of its markets are listed.
              { chain_id: 4217, market_id: id("03"), type: "borrow", debt: "9" },
            ],
          },
    );
    const positions = await fetchMorphoPositions(USER, fakeFetch(graphql, rest) as unknown as typeof fetch);

    expect(graphql).toHaveBeenCalledTimes(2);
    expect(positions.filter(({ protocol }) => protocol === "morpho-blue")).toHaveLength(101);
    expect(positions.filter(({ protocol }) => protocol === "morpho-midnight")).toEqual([
      { protocol: "morpho-midnight", chainId: 1, marketId: id("01"), preLiquidations: [] },
      { protocol: "morpho-midnight", chainId: 8453, marketId: id("ef"), preLiquidations: [] },
    ]);
    const firstUrl = rest.mock.calls[0][0];
    expect(firstUrl.pathname).toBe(`/v0/midnight/users/${USER}/positions`);
    expect(Object.fromEntries(firstUrl.searchParams)).toEqual({
      types: "borrow",
      listed: "true",
      chain_ids: "1,8453,5042,4663",
      limit: "100",
    });
  });

  it("fails with MorphoApiError when the API is down or answers with errors", async () => {
    const down = vi.fn(async () => new Response("", { status: 503 }));
    await expect(fetchMorphoPositions(USER, down as unknown as typeof fetch)).rejects.toBeInstanceOf(MorphoApiError);

    const errors = fakeFetch(() => ({ errors: [{ message: "boom" }] }), noMidnight);
    await expect(fetchMorphoPositions(USER, errors as unknown as typeof fetch)).rejects.toBeInstanceOf(MorphoApiError);

    const offline = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(fetchMorphoPositions(USER, offline as unknown as typeof fetch)).rejects.toBeInstanceOf(MorphoApiError);
  });
});

describe("fetchMorphoListing", () => {
  it("returns null for a Blue market the API answers NOT_FOUND for, as it does for an id it does not know", async () => {
    const notFound = fakeFetch(
      () => ({ errors: [{ message: "No results matching given parameters", status: "NOT_FOUND" }], data: null }),
      noMidnight,
    );
    expect(await fetchMorphoListing("morpho-blue", 1, id("ab"), notFound as unknown as typeof fetch)).toBe(null);
  });

  it("fails with MorphoApiError, never a TypeError, when the API answers in another shape", async () => {
    const notJson = vi.fn(async () => new Response("<html>", { status: 200 }));
    await expect(
      fetchMorphoListing("morpho-blue", 1, id("ab"), notJson as unknown as typeof fetch),
    ).rejects.toBeInstanceOf(MorphoApiError);

    const odd = fakeFetch(
      () => ({}),
      () => ({ data: { not: "a list" } }),
    );
    await expect(
      fetchMorphoListing("morpho-midnight", 1, id("ab"), odd as unknown as typeof fetch),
    ).rejects.toBeInstanceOf(MorphoApiError);
    await expect(
      fetchMorphoPositions(
        USER,
        fakeFetch(() => ({ data: { marketPositions: null } }), noMidnight) as unknown as typeof fetch,
      ),
    ).rejects.toBeInstanceOf(MorphoApiError);
  });

  it("reads a Blue market's listing and its pre-liquidation contracts", async () => {
    const fetchImpl = fakeFetch(
      ({ variables }) => ({
        data: {
          marketById: { marketId: variables.marketId, listed: true, preLiquidations: { items: [{ address: PRE }] } },
        },
      }),
      noMidnight,
    );
    expect(await fetchMorphoListing("morpho-blue", 1, id("ab"), fetchImpl as unknown as typeof fetch)).toEqual({
      listed: true,
      preLiquidations: [PRE],
    });
  });

  it("returns null for a market the API does not know, or answers about another one", async () => {
    const unknown = fakeFetch(() => ({ data: { marketById: null } }), noMidnight);
    expect(await fetchMorphoListing("morpho-blue", 1, id("ab"), unknown as unknown as typeof fetch)).toBe(null);

    const other = fakeFetch(() => ({ data: { marketById: { marketId: id("cd"), listed: true } } }), noMidnight);
    expect(await fetchMorphoListing("morpho-blue", 1, id("ab"), other as unknown as typeof fetch)).toBe(null);
  });

  it("reads a Midnight market's listing for its chain only", async () => {
    const rest = vi.fn((url: URL) => ({
      data: [
        { market_id: url.searchParams.get("market_ids"), chain_id: 8453, listed: true },
        { market_id: url.searchParams.get("market_ids"), chain_id: 1, listed: false },
      ],
    }));
    const fetchImpl = fakeFetch(() => ({}), rest) as unknown as typeof fetch;

    expect(await fetchMorphoListing("morpho-midnight", 8453, id("ab"), fetchImpl)).toEqual({
      listed: true,
      preLiquidations: [],
    });
    expect(await fetchMorphoListing("morpho-midnight", 1, id("ab"), fetchImpl)).toEqual({
      listed: false,
      preLiquidations: [],
    });
    expect(await fetchMorphoListing("morpho-midnight", 5042, id("ab"), fetchImpl)).toBe(null);
  });
});
