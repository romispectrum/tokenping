import { format, resolveConfig } from "prettier";
import { arbitrum, mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";
import { AAVE_MARKETS } from "~~/config/aaveConfig";
import {
  COINGECKO_PLATFORMS,
  IMAGE_OVERRIDES,
  WHITE_BACKED_IMAGES,
  findLostIcons,
  parseCoinGeckoImage,
  renderTokenIconsModule,
} from "~~/scripts/tokenIconSources";

const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const ARB_USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

describe("COINGECKO_PLATFORMS", () => {
  it("names a CoinGecko platform for every Aave market", () => {
    for (const { chain } of AAVE_MARKETS) expect(COINGECKO_PLATFORMS[chain.id], chain.name).toBeTruthy();
  });
});

// Both lists are keyed by CoinGecko's numeric image id, the name of the icon file.
describe("per-image fixes", () => {
  it("key IMAGE_OVERRIDES and WHITE_BACKED_IMAGES by image id", () => {
    for (const id of [...Object.keys(IMAGE_OVERRIDES), ...WHITE_BACKED_IMAGES]) expect(id).toMatch(/^\d+$/);
  });
});

describe("parseCoinGeckoImage", () => {
  // The token lists link the 25px thumb; the script downloads the 250px original and scales it down itself.
  it("turns a token-list thumb into the large image and keeps the cache-busting query", () => {
    expect(parseCoinGeckoImage("https://assets.coingecko.com/coins/images/6319/thumb/USDC.png?1769615602")).toEqual({
      id: "6319",
      largeUrl: "https://assets.coingecko.com/coins/images/6319/large/USDC.png?1769615602",
    });
  });

  it("accepts the API's image host and any size", () => {
    expect(parseCoinGeckoImage("https://coin-images.coingecko.com/coins/images/2518/small/weth.png")).toEqual({
      id: "2518",
      largeUrl: "https://coin-images.coingecko.com/coins/images/2518/large/weth.png",
    });
  });

  it("swaps a broken image for its override, whatever file the source names", () => {
    const url =
      "https://coin-images.coingecko.com/coins/images/13469/large/0x111111111117dc0aa78b770fa6a738034120c302_0x2b2c.jpg?1";

    expect(parseCoinGeckoImage(url)).toEqual({ id: "13469", largeUrl: IMAGE_OVERRIDES["13469"] });
  });

  it("only overrides with CoinGecko images of the same coin", () => {
    for (const [id, url] of Object.entries(IMAGE_OVERRIDES)) {
      expect(parseCoinGeckoImage(url)?.id, url).toBe(id);
    }
  });

  it.each([
    [
      "CoinGecko's placeholder for a coin without a logo",
      "https://assets.coingecko.com/coins/images/1/large/missing_large.png",
    ],
    ["another host", "https://evil.example/coins/images/6319/large/USDC.png"],
    ["plain http", "http://assets.coingecko.com/coins/images/6319/large/USDC.png"],
    ["a path that is not a coin image", "https://assets.coingecko.com/markets/images/1/large/x.png"],
    ["a nested path", "https://assets.coingecko.com/coins/images/6319/large/a/b.png"],
    ["not a URL", "USDC.png"],
    ["an empty value", ""],
    ["no value", undefined],
  ])("rejects %s", (_, url) => {
    expect(parseCoinGeckoImage(url)).toBeNull();
  });
});

describe("findLostIcons", () => {
  const previous = { "1:0xaa": "1", "1:0xbb": "2", "1:0xcc": "3" };

  it("lists reserves that had an icon and would lose it", () => {
    expect(findLostIcons(previous, new Set(["1:0xaa", "1:0xbb", "1:0xcc"]), new Set(["1:0xaa"]))).toEqual([
      "1:0xbb",
      "1:0xcc",
    ]);
  });

  it("does not count delisted reserves or reserves that are new", () => {
    expect(findLostIcons(previous, new Set(["1:0xaa", "1:0xdd"]), new Set(["1:0xaa"]))).toEqual([]);
  });
});

describe("renderTokenIconsModule", () => {
  const chainNames = new Map([
    [mainnet.id, "Ethereum"],
    [arbitrum.id, "Arbitrum"],
  ]);
  const source = renderTokenIconsModule(
    [
      { chainId: arbitrum.id, address: ARB_USDC, symbol: "USDC", icon: "6319" },
      { chainId: mainnet.id, address: WETH, symbol: "WETH", icon: "2518" },
      { chainId: mainnet.id, address: USDC, symbol: "USDC", icon: "6319" },
    ],
    chainNames,
  );

  it("groups entries by chain in market order and sorts them by lowercase address", () => {
    const keys = [...source.matchAll(/"(\d+:0x[0-9a-f]{40})"/g)].map(match => match[1]);

    expect(keys).toEqual([`1:${USDC.toLowerCase()}`, `1:${WETH.toLowerCase()}`, `42161:${ARB_USDC.toLowerCase()}`]);
    expect(source.indexOf("// Ethereum")).toBeLessThan(source.indexOf("// Arbitrum"));
  });

  it("skips chains without entries", () => {
    expect(renderTokenIconsModule([], chainNames)).not.toContain("// Ethereum");
  });

  // Symbols are read from token contracts, so they cannot be trusted inside generated source.
  it("keeps a symbol from breaking out of its comment", () => {
    const hostile = renderTokenIconsModule(
      [{ chainId: mainnet.id, address: USDC, symbol: "USD₮0\nexport const x = 1;", icon: "1" }],
      chainNames,
    );

    expect(hostile).toContain(`"1:${USDC.toLowerCase()}": "1", // USD?0?export const x = 1;\n`);
    expect(hostile).not.toMatch(/^export const x/m);
  });

  // The generated file is linted like any other: it must come out already formatted.
  it("writes source that Prettier leaves unchanged", async () => {
    const filepath = new URL("../config/tokenIcons.generated.ts", import.meta.url).pathname;
    const options = await resolveConfig(filepath);

    expect(await format(source, { ...options, filepath })).toBe(source);
  });
});
