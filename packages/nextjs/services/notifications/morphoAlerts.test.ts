import { afterEach, describe, expect, it, vi } from "vitest";
import { getMorphoChain } from "~~/config/morpho";
import type { MorphoClient } from "~~/services/morpho/client";
import { readBlueHealth, readMidnightHealth } from "~~/services/morpho/health";
import type { BlueMarketParams, MidnightMarketParams, MorphoReading } from "~~/services/morpho/types";
import {
  type MorphoAlert,
  TIMED_OUT,
  morphoNotices,
  readMorphoPositions,
  toMorphoAlert,
} from "~~/services/notifications/morphoAlerts";

vi.mock("~~/services/supabase/supabaseServer", () => ({ getSupabaseServerClient: vi.fn() }));
vi.mock("~~/services/morpho/health", () => ({ readBlueHealth: vi.fn(), readMidnightHealth: vi.fn() }));

const MARKET = `0x${"7e".repeat(32)}`;
const TOKEN = { address: "0x00000000000000000000000000000000000000b1", symbol: "USDC", decimals: 6 } as const;
const BLUE: BlueMarketParams = {
  kind: "blue",
  loanToken: TOKEN,
  collateralToken: TOKEN,
  oracle: "0x00000000000000000000000000000000000000e1",
  irm: "0x00000000000000000000000000000000000000c1",
  lltv: "860000000000000000",
  preLiquidations: [],
};
const MATURITY = 1_793_372_400;
const MIDNIGHT: MidnightMarketParams = {
  kind: "midnight",
  loanToken: TOKEN,
  collaterals: [{ token: TOKEN, lltv: "915000000000000000", oracle: "0x00000000000000000000000000000000000000f1" }],
  maturity: MATURITY,
};
const DAY = 86_400;

afterEach(() => {
  vi.useRealTimers();
  vi.mocked(readBlueHealth).mockReset();
  vi.mocked(readMidnightHealth).mockReset();
});

describe("toMorphoAlert", () => {
  const row = (overrides: Record<string, unknown> = {}) => ({
    chain_id: 8453,
    protocol: "morpho-blue",
    market: MARKET,
    market_params: BLUE,
    ...overrides,
  });

  it("reads a Morpho row with its chain and stored parameters", () => {
    expect(toMorphoAlert(row())).toEqual({
      row: row(),
      protocol: "morpho-blue",
      chain: getMorphoChain(8453),
      marketId: MARKET,
      params: BLUE,
    });
  });

  it.each([
    ["an Aave row", { protocol: "aave", market: "v3", market_params: null }],
    ["a chain Tokenping does not cover", { chain_id: 56 }],
    ["Midnight on a chain without it", { chain_id: 42161, protocol: "morpho-midnight", market_params: MIDNIGHT }],
    ["another protocol's parameters", { market_params: MIDNIGHT }],
    ["no parameters", { market_params: null }],
    ["an id that is no Morpho id", { market: "0x1234" }],
  ])("has nothing for %s", (_label, overrides) => {
    expect(toMorphoAlert(row(overrides))).toBeNull();
  });
});

describe("morphoNotices", () => {
  const reading = (healthFactor: bigint, timestamp: number, debt = 1n): MorphoReading => ({
    healthFactor,
    line: "lltv",
    debt,
    collateralValue: 1n,
    timestamp,
  });
  const LOW = 1_040_000_000_000_000_000n;
  const HIGH = 2_000_000_000_000_000_000n;

  it("alerts a Blue position below the threshold only", () => {
    expect(morphoNotices(BLUE, reading(LOW, 0), 1.05)).toEqual([{ kind: "health" }]);
    expect(morphoNotices(BLUE, reading(HIGH, 0), 1.05)).toEqual([]);
  });

  it.each([
    ["more than 7 days before", MATURITY - 7 * DAY - 1, []],
    ["7 days before", MATURITY - 7 * DAY, [{ kind: "maturity", stage: "7d", maturity: MATURITY }]],
    ["just over a day before", MATURITY - DAY - 1, [{ kind: "maturity", stage: "7d", maturity: MATURITY }]],
    ["a day before", MATURITY - DAY, [{ kind: "maturity", stage: "1d", maturity: MATURITY }]],
    ["a second before", MATURITY - 1, [{ kind: "maturity", stage: "1d", maturity: MATURITY }]],
    ["at maturity", MATURITY, [{ kind: "maturity", stage: "matured", maturity: MATURITY }]],
    ["a week after", MATURITY + 7 * DAY, [{ kind: "maturity", stage: "matured", maturity: MATURITY }]],
  ])("reminds a healthy Midnight loan %s as %j", (_label, timestamp, expected) => {
    expect(morphoNotices(MIDNIGHT, reading(HIGH, timestamp), 1.05)).toEqual(expected);
  });

  it("puts the health alert before the reminder, and only the maturity alert after maturity", () => {
    expect(morphoNotices(MIDNIGHT, reading(LOW, MATURITY - DAY), 1.05)).toEqual([
      { kind: "health" },
      { kind: "maturity", stage: "1d", maturity: MATURITY },
    ]);
    expect(morphoNotices(MIDNIGHT, reading(LOW, MATURITY + 1), 1.05)).toEqual([
      { kind: "maturity", stage: "matured", maturity: MATURITY },
    ]);
  });

  it("says nothing about a loan without debt, matured or not", () => {
    expect(morphoNotices(MIDNIGHT, reading(0n, MATURITY + 1, 0n), 1.05)).toEqual([]);
    expect(morphoNotices(BLUE, reading(0n, 0, 0n), 1.05)).toEqual([]);
  });
});

describe("readMorphoPositions", () => {
  const alert = (chainId: number, user: string, params: BlueMarketParams | MidnightMarketParams = BLUE) =>
    ({
      row: { user_id: user },
      protocol: params.kind === "blue" ? "morpho-blue" : "morpho-midnight",
      chain: getMorphoChain(chainId)!,
      marketId: MARKET,
      params,
    }) as MorphoAlert<{ user_id: string }>;
  const READING = { healthFactor: 1n, line: "lltv", debt: 1n, collateralValue: 1n, timestamp: 1 } as const;
  const clientFor = (chain: { id: number }) => ({ chainId: chain.id }) as unknown as MorphoClient;

  it("reads each alert with its protocol's reader and its own chain's client, in the order given", async () => {
    vi.mocked(readBlueHealth).mockResolvedValue(READING);
    vi.mocked(readMidnightHealth).mockResolvedValue(null);
    const alerts = [alert(1, "0xa"), alert(8453, "0xb", MIDNIGHT), alert(1, "0xc")];

    expect(await readMorphoPositions(alerts, Date.now() + 1000, clientFor)).toEqual([READING, null, READING]);
    expect(vi.mocked(readBlueHealth).mock.calls.map(([client, , , user]) => [client, user])).toEqual([
      [{ chainId: 1 }, "0xa"],
      [{ chainId: 1 }, "0xc"],
    ]);
    expect(vi.mocked(readMidnightHealth).mock.calls[0][0]).toEqual({ chainId: 8453 });
  });

  it("reads a failing position as null without stopping the others", async () => {
    vi.mocked(readBlueHealth).mockRejectedValueOnce(new Error("rpc down")).mockResolvedValue(READING);
    expect(await readMorphoPositions([alert(1, "0xa"), alert(1, "0xb")], Date.now() + 1000, clientFor)).toEqual([
      null,
      READING,
    ]);
  });

  it("reads at most 4 positions at once on a chain, and chains side by side", async () => {
    let open = 0;
    let most = 0;
    vi.mocked(readBlueHealth).mockImplementation(async () => {
      most = Math.max(most, ++open);
      await new Promise(resolve => setTimeout(resolve, 1));
      open--;
      return READING;
    });
    const alerts = [
      ...Array.from({ length: 10 }, () => alert(1, "0xa")),
      ...Array.from({ length: 10 }, () => alert(8453, "0xb")),
    ];

    await readMorphoPositions(alerts, Date.now() + 10_000, clientFor);

    expect(most).toBe(8);
  });

  it("stops at the deadline: reads in flight are TIMED_OUT and the rest never start", async () => {
    vi.useFakeTimers();
    vi.mocked(readBlueHealth)
      .mockResolvedValueOnce(READING)
      .mockImplementation(() => new Promise(() => undefined));
    // Four at once: the first answers and its worker takes the fifth; the sixth waits for a worker past the deadline.
    const alerts = ["0xa", "0xb", "0xc", "0xd", "0xe", "0xf"].map(user => alert(1, user));

    const run = readMorphoPositions(alerts, Date.now() + 2000, clientFor);
    await vi.advanceTimersByTimeAsync(2000);

    expect(await run).toEqual([READING, TIMED_OUT, TIMED_OUT, TIMED_OUT, TIMED_OUT, TIMED_OUT]);
    expect(readBlueHealth).toHaveBeenCalledTimes(5);
  });
});
