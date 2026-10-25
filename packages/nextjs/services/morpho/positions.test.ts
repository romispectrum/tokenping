import type { Address, Hex } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMorphoChain } from "~~/config/morpho";
import type { MorphoClient } from "~~/services/morpho/client";
import { readBlueHealth, readMidnightHealth } from "~~/services/morpho/health";
import { readBlueMarketParams, readMidnightMarketParams } from "~~/services/morpho/params";
import { morphoRefKey, readMorphoPosition } from "~~/services/morpho/positions";

vi.mock("~~/services/morpho/params", () => ({ readBlueMarketParams: vi.fn(), readMidnightMarketParams: vi.fn() }));
vi.mock("~~/services/morpho/health", () => ({ readBlueHealth: vi.fn(), readMidnightHealth: vi.fn() }));

const USER = "0x00000000000000000000000000000000000000aa" as Address;
const MARKET = `0x${"3a".repeat(32)}` as Hex;
const PRE = "0x00000000000000000000000000000000000000d1" as Address;
const CLIENT = { id: "client" } as unknown as MorphoClient;
const PARAMS = { kind: "blue" } as never;
const MIDNIGHT_PARAMS = { kind: "midnight" } as never;
const READING = { healthFactor: 1n, line: "lltv", debt: 1n, collateralValue: 1n, timestamp: 1 } as const;
const blueRef = { protocol: "morpho-blue" as const, chainId: 8453, marketId: MARKET, preLiquidations: [PRE] };

beforeEach(() => {
  vi.mocked(readBlueMarketParams).mockReset().mockResolvedValue(PARAMS);
  vi.mocked(readMidnightMarketParams).mockReset().mockResolvedValue(MIDNIGHT_PARAMS);
  vi.mocked(readBlueHealth).mockReset().mockResolvedValue(READING);
  vi.mocked(readMidnightHealth).mockReset().mockResolvedValue(READING);
});

describe("readMorphoPosition", () => {
  it("reads a Blue market with the API's pre-liquidation candidates, then the position", async () => {
    const base = getMorphoChain(8453)!;
    expect(await readMorphoPosition(blueRef, USER, () => CLIENT)).toEqual({
      key: `morpho-blue:8453:${MARKET}`,
      protocol: "morpho-blue",
      chain: base,
      marketId: MARKET,
      params: PARAMS,
      reading: READING,
    });
    expect(readBlueMarketParams).toHaveBeenCalledWith(CLIENT, base, MARKET, [PRE]);
    expect(readBlueHealth).toHaveBeenCalledWith(CLIENT, base, MARKET, USER, PARAMS);
  });

  it("reads a Midnight market with Midnight's readers", async () => {
    const ref = { protocol: "morpho-midnight" as const, chainId: 1, marketId: MARKET, preLiquidations: [] };
    expect(await readMorphoPosition(ref, USER, () => CLIENT)).toMatchObject({
      params: MIDNIGHT_PARAMS,
      reading: READING,
    });
    expect(readMidnightHealth).toHaveBeenCalledOnce();
  });

  it("reports a market the chain does not have, and throws when the position cannot be read", async () => {
    vi.mocked(readBlueMarketParams).mockResolvedValueOnce(null);
    expect(await readMorphoPosition(blueRef, USER, () => CLIENT)).toMatchObject({ params: null, reading: null });

    vi.mocked(readBlueHealth).mockResolvedValueOnce(null);
    await expect(readMorphoPosition(blueRef, USER, () => CLIENT)).rejects.toThrow("could not be read");
    await expect(readMorphoPosition({ ...blueRef, chainId: 56 }, USER, () => CLIENT)).rejects.toThrow("chain 56");
  });

  it("keys a position as the alert API keys its config", () => {
    expect(morphoRefKey(blueRef)).toBe(`morpho-blue:8453:${MARKET}`);
  });
});
