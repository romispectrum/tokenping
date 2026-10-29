import { describe, expect, it } from "vitest";
import { AAVE_MARKETS, AAVE_V4_SPOKES, marketLabel } from "~~/config/aaveConfig";
import {
  capitalize,
  csForMarket,
  csOnMarket,
  formatDecimal,
  formatLongDate,
  hiMarket,
  joinList,
  plural,
} from "~~/i18n/format";

describe("csOnMarket and csForMarket", () => {
  it("call a V3 market a network", () => {
    expect(csOnMarket("Arbitrum")).toBe("na síti Arbitrum");
    expect(csForMarket("Arbitrum")).toBe("pro síť Arbitrum");
  });

  it("call a V4 Spoke a market", () => {
    expect(csOnMarket("Ethereum (V4 Lido)")).toBe("na trhu Ethereum (V4 Lido)");
    expect(csForMarket("Ethereum (V4 Lido)")).toBe("pro trh Ethereum (V4 Lido)");
  });

  it("tell every configured market apart by the name marketLabel gives it", () => {
    for (const market of AAVE_MARKETS) expect(csOnMarket(marketLabel(market))).toMatch(/^na síti /);
    for (const spoke of AAVE_V4_SPOKES) expect(csOnMarket(marketLabel(spoke))).toMatch(/^na trhu /);
  });

  // A Morpho market's label ("OETH/USDC (86%)") names a market, which no regex on Aave labels could tell.
  it("follow an explicit kind over the label", () => {
    expect(csOnMarket("OETH/USDC (86%)", "market")).toBe("na trhu OETH/USDC (86%)");
    expect(csForMarket("OETH/USDC (86%)", "market")).toBe("pro trh OETH/USDC (86%)");
    expect(csOnMarket("Ethereum (V4 Lido)", "network")).toBe("na síti Ethereum (V4 Lido)");
  });
});

describe("capitalize", () => {
  it("upper-cases only the first letter", () => {
    expect(capitalize("na síti Base")).toBe("Na síti Base");
    expect(capitalize("")).toBe("");
  });
});

describe("Spanish formatting", () => {
  it("joins with y and o, turning them into e before an i sound and u before an o sound", () => {
    expect(joinList("es", ["Signal", "Telegram", "correo electrónico"])).toBe("Signal, Telegram y correo electrónico");
    expect(joinList("es", ["Signal", "correo electrónico"], "disjunction")).toBe("Signal o correo electrónico");
    expect(joinList("es", ["Base", "Ink"])).toBe("Base e Ink");
    expect(joinList("es", ["Arbitrum", "OP Mainnet"], "disjunction")).toBe("Arbitrum u OP Mainnet");
    // A "hie" sound is not an i: "y hielo".
    expect(joinList("es", ["agua", "hielo"])).toBe("agua y hielo");
    expect(joinList("es", ["Signal"])).toBe("Signal");
  });

  it("writes dates the Latin American way and keeps the decimal point", () => {
    expect(formatLongDate("es", "2026-10-14")).toBe("14 de octubre de 2026");
    expect(formatDecimal("es", "1.42")).toBe("1.42");
  });
});

describe("Hindi formatting", () => {
  it("joins with और and या, writes dates in Devanagari and keeps the decimal point", () => {
    expect(joinList("hi", ["Signal", "Telegram", "ईमेल"])).toBe("Signal, Telegram और ईमेल");
    expect(joinList("hi", ["Signal", "ईमेल"], "disjunction")).toBe("Signal या ईमेल");
    expect(formatLongDate("hi", "2026-10-14")).toBe("14 अक्टूबर 2026");
    expect(formatDecimal("hi", "1.42")).toBe("1.42");
    expect(plural("hi", 1, { one: "1 नेटवर्क", other: "कई नेटवर्क" })).toBe("1 नेटवर्क");
    expect(plural("hi", 0, { one: "0 नेटवर्क", other: "कई नेटवर्क" })).toBe("0 नेटवर्क");
    expect(plural("hi", 7, { one: "1 नेटवर्क", other: "7 नेटवर्क" })).toBe("7 नेटवर्क");
    expect(hiMarket("Ethereum")).toBe("Ethereum नेटवर्क");
    expect(hiMarket("Ethereum (V4 Lido)")).toBe("Ethereum (V4 Lido) मार्केट");
    expect(hiMarket("USDC | cbBTC (86%)", "market")).toBe("USDC | cbBTC (86%) मार्केट");
  });

  it("picks one or other", () => {
    const networks = (count: number) => plural("es", count, { one: `${count} red`, other: `${count} redes` });

    expect(networks(1)).toBe("1 red");
    expect(networks(29)).toBe("29 redes");
  });
});
