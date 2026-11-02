import { describe, expect, it } from "vitest";
import { AAVE_MARKETS, AAVE_V4_SPOKES, marketLabel } from "~~/config/aaveConfig";
import {
  capitalize,
  csForMarket,
  csOnMarket,
  deForMarket,
  deOnMarket,
  formatDecimal,
  formatLongDate,
  frForMarket,
  frOnMarket,
  hiMarket,
  idForMarket,
  idOnMarket,
  itForMarket,
  itOnMarket,
  itTo,
  joinList,
  plForMarket,
  plOnMarket,
  plural,
  ptForMarket,
  ptOnMarket,
  trForMarket,
  trOnMarket,
  viMarket,
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
});

describe("German formatting", () => {
  it("joins with und and oder, writes German dates, a decimal comma and the market wording", () => {
    expect(joinList("de", ["Signal", "Telegram", "E-Mail"])).toBe("Signal, Telegram und E-Mail");
    expect(joinList("de", ["Signal", "E-Mail"], "disjunction")).toBe("Signal oder E-Mail");
    expect(formatLongDate("de", "2026-10-14")).toBe("14. Oktober 2026");
    expect(formatDecimal("de", "1.42")).toBe("1,42");
    expect(plural("de", 1, { one: "1 Netzwerk", other: "Netzwerke" })).toBe("1 Netzwerk");
    expect(plural("de", 7, { one: "1 Netzwerk", other: "7 Netzwerke" })).toBe("7 Netzwerke");
    expect(deOnMarket("Ethereum")).toBe("im Netzwerk Ethereum");
    expect(deOnMarket("Ethereum (V4 Lido)")).toBe("im Markt Ethereum (V4 Lido)");
    expect(deForMarket("Base")).toBe("für das Netzwerk Base");
    expect(deForMarket("USDC | cbBTC (86%)", "market")).toBe("für den Markt USDC | cbBTC (86%)");
  });
});

describe("French formatting", () => {
  it("joins with et and ou, writes French dates, a decimal comma and the market wording", () => {
    expect(joinList("fr", ["Signal", "Telegram", "e-mail"])).toBe("Signal, Telegram et e-mail");
    expect(joinList("fr", ["Signal", "e-mail"], "disjunction")).toBe("Signal ou e-mail");
    expect(formatLongDate("fr", "2026-10-14")).toBe("14 octobre 2026");
    expect(formatDecimal("fr", "1.42")).toBe("1,42");
    // French counts 0 and 1 as one.
    expect(plural("fr", 0, { one: "0 réseau", other: "0 réseaux" })).toBe("0 réseau");
    expect(plural("fr", 7, { one: "1 réseau", other: "7 réseaux" })).toBe("7 réseaux");
    expect(frOnMarket("Arbitrum")).toBe("sur Arbitrum");
    expect(frOnMarket("Ethereum (V4 Lido)")).toBe("sur le marché Ethereum (V4 Lido)");
    expect(frOnMarket("Base", "network")).toBe("sur Base");
    expect(frForMarket("Base")).toBe("pour Base");
    expect(frForMarket("USDC | cbBTC (86%)", "market")).toBe("pour le marché USDC | cbBTC (86%)");
  });
});

describe("Portuguese formatting", () => {
  it("joins with e and ou, writes Brazilian dates, a decimal comma and the market wording", () => {
    expect(joinList("pt", ["Signal", "Telegram", "e-mail"])).toBe("Signal, Telegram e e-mail");
    expect(joinList("pt", ["Signal", "e-mail"], "disjunction")).toBe("Signal ou e-mail");
    expect(formatLongDate("pt", "2026-10-14")).toBe("14 de outubro de 2026");
    expect(formatDecimal("pt", "1.42")).toBe("1,42");
    // Brazilian Portuguese counts 0 and 1 as one.
    expect(plural("pt", 0, { one: "0 rede", other: "0 redes" })).toBe("0 rede");
    expect(plural("pt", 7, { one: "1 rede", other: "7 redes" })).toBe("7 redes");
    expect(ptOnMarket("Arbitrum")).toBe("na rede Arbitrum");
    expect(ptOnMarket("Ethereum (V4 Lido)")).toBe("no mercado Ethereum (V4 Lido)");
    expect(ptOnMarket("Base", "network")).toBe("na rede Base");
    expect(ptForMarket("Base")).toBe("para a rede Base");
    expect(ptForMarket("USDC | cbBTC (86%)", "market")).toBe("para o mercado USDC | cbBTC (86%)");
  });
});

describe("Italian formatting", () => {
  it("writes ad before a name that starts with an a", () => {
    expect(itTo("Arbitrum One")).toBe("ad Arbitrum One");
    expect(itTo("Base")).toBe("a Base");
  });

  it("joins with e and o, writes Italian dates, a decimal comma and the market wording", () => {
    expect(joinList("it", ["Signal", "Telegram", "email"])).toBe("Signal, Telegram e email");
    expect(joinList("it", ["Signal", "email"], "disjunction")).toBe("Signal o email");
    expect(formatLongDate("it", "2026-10-14")).toBe("14 ottobre 2026");
    expect(formatDecimal("it", "1.42")).toBe("1,42");
    // Italian uses many for a million and up, one only for 1.
    expect(plural("it", 1, { one: "1 rete", other: "1 reti" })).toBe("1 rete");
    expect(plural("it", 0, { one: "0 rete", other: "0 reti" })).toBe("0 reti");
    expect(plural("it", 1_000_000, { one: "x", many: "1.000.000 di reti", other: "x" })).toBe("1.000.000 di reti");
    expect(itOnMarket("Arbitrum")).toBe("su Arbitrum");
    expect(itOnMarket("Ethereum (V4 Lido)")).toBe("sul mercato Ethereum (V4 Lido)");
    expect(itOnMarket("Base", "network")).toBe("su Base");
    expect(itForMarket("Base")).toBe("per Base");
    expect(itForMarket("USDC | cbBTC (86%)", "market")).toBe("per il mercato USDC | cbBTC (86%)");
  });
});

describe("Polish formatting", () => {
  it("joins with i and lub, writes Polish dates, a decimal comma and the market wording", () => {
    expect(joinList("pl", ["Signal", "Telegram", "e-mail"])).toBe("Signal, Telegram i e-mail");
    expect(joinList("pl", ["Signal", "e-mail"], "disjunction")).toBe("Signal lub e-mail");
    expect(formatLongDate("pl", "2026-10-14")).toBe("14 października 2026");
    expect(formatDecimal("pl", "1.42")).toBe("1,42");
    // Polish uses one for 1, few for 2-4 (22-24, ...), many for 0, 5-21 and 25-31, other for fractions.
    const networks = (count: number) =>
      plural("pl", count, { one: `${count} sieć`, few: `${count} sieci (few)`, many: `${count} sieci`, other: "x" });
    expect(networks(1)).toBe("1 sieć");
    expect(networks(3)).toBe("3 sieci (few)");
    expect(networks(22)).toBe("22 sieci (few)");
    expect(networks(12)).toBe("12 sieci");
    expect(networks(0)).toBe("0 sieci");
    expect(plOnMarket("Arbitrum")).toBe("w sieci Arbitrum");
    expect(plOnMarket("Ethereum (V4 Lido)")).toBe("na rynku Ethereum (V4 Lido)");
    expect(plOnMarket("Base", "network")).toBe("w sieci Base");
    expect(plForMarket("Base")).toBe("dla sieci Base");
    expect(plForMarket("USDC | cbBTC (86%)", "market")).toBe("dla rynku USDC | cbBTC (86%)");
  });
});

describe("Turkish formatting", () => {
  it("joins with ve and veya, writes Turkish dates, a decimal comma and the market wording", () => {
    expect(joinList("tr", ["Signal", "Telegram", "e-posta"])).toBe("Signal, Telegram ve e-posta");
    expect(joinList("tr", ["Signal", "e-posta"], "disjunction")).toBe("Signal veya e-posta");
    expect(formatLongDate("tr", "2026-10-14")).toBe("14 Ekim 2026");
    expect(formatDecimal("tr", "1.42")).toBe("1,42");
    // Turkish uses one for 1 and other for everything else; the noun stays singular after a number either way.
    expect(plural("tr", 1, { one: "1 ağ", other: "1 ağ (other)" })).toBe("1 ağ");
    expect(plural("tr", 3, { one: "x", other: "3 ağ" })).toBe("3 ağ");
    expect(trOnMarket("Arbitrum")).toBe("Arbitrum ağında");
    expect(trOnMarket("Ethereum (V4 Lido)")).toBe("Ethereum (V4 Lido) piyasasında");
    expect(trOnMarket("Base", "network")).toBe("Base ağında");
    expect(trForMarket("Base")).toBe("Base ağı için");
    expect(trForMarket("USDC | cbBTC (86%)", "market")).toBe("USDC | cbBTC (86%) piyasası için");
  });
});

describe("Indonesian formatting", () => {
  it("joins with dan and atau, writes Indonesian dates, a decimal comma and the market wording", () => {
    expect(joinList("id", ["Signal", "Telegram", "email"])).toBe("Signal, Telegram dan email");
    expect(joinList("id", ["Signal", "email"], "disjunction")).toBe("Signal atau email");
    expect(formatLongDate("id", "2026-10-14")).toBe("14 Oktober 2026");
    expect(formatDecimal("id", "1.42")).toBe("1,42");
    // Indonesian has no plural: every count takes the "other" form.
    expect(plural("id", 1, { one: "1 jaringan (one)", other: "1 jaringan" })).toBe("1 jaringan");
    expect(idOnMarket("Arbitrum")).toBe("di jaringan Arbitrum");
    expect(idOnMarket("Ethereum (V4 Lido)")).toBe("di pasar Ethereum (V4 Lido)");
    expect(idOnMarket("Base", "network")).toBe("di jaringan Base");
    expect(idForMarket("Base")).toBe("untuk jaringan Base");
    expect(idForMarket("USDC | cbBTC (86%)", "market")).toBe("untuk pasar USDC | cbBTC (86%)");
  });
});

describe("Vietnamese formatting", () => {
  it("joins with và and hoặc, writes Vietnamese dates, a decimal comma and the market wording", () => {
    expect(joinList("vi", ["Signal", "Telegram", "email"])).toBe("Signal, Telegram và email");
    expect(joinList("vi", ["Signal", "email"], "disjunction")).toBe("Signal hoặc email");
    expect(formatLongDate("vi", "2026-10-14")).toBe("14 tháng 10, 2026");
    expect(formatDecimal("vi", "1.42")).toBe("1,42");
    // Vietnamese has no plural: every count takes the "other" form.
    expect(plural("vi", 1, { one: "1 mạng", other: "1 mạng (other)" })).toBe("1 mạng (other)");
    expect(viMarket("Ethereum")).toBe("mạng Ethereum");
    expect(viMarket("Ethereum (V4 Lido)")).toBe("thị trường Ethereum (V4 Lido)");
  });

  it("picks one or other", () => {
    const networks = (count: number) => plural("es", count, { one: `${count} red`, other: `${count} redes` });

    expect(networks(1)).toBe("1 red");
    expect(networks(29)).toBe("29 redes");
  });
});
