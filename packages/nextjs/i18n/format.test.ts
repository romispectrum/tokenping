import { describe, expect, it } from "vitest";
import { AAVE_MARKETS, AAVE_V4_SPOKES, marketLabel } from "~~/config/aaveConfig";
import {
  bgForMarket,
  bgOnMarket,
  capitalize,
  csForMarket,
  csOnMarket,
  daForMarket,
  daOnMarket,
  deForMarket,
  deOnMarket,
  filForMarket,
  filOnMarket,
  formatDecimal,
  formatLongDate,
  frForMarket,
  frOnMarket,
  hiMarket,
  hrForMarket,
  hrOnMarket,
  hrSrChannelsGenitive,
  huArticle,
  huForMarket,
  huOnMarket,
  idForMarket,
  idOnMarket,
  itForMarket,
  itOnMarket,
  itTo,
  joinList,
  nbForMarket,
  nbOnMarket,
  nlForMarket,
  nlOnMarket,
  plForMarket,
  plOnMarket,
  plural,
  ptForMarket,
  ptOnMarket,
  roForMarket,
  roOnMarket,
  slForMarket,
  slOnMarket,
  srForMarket,
  srOnMarket,
  svForMarket,
  svOnMarket,
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

describe("Dutch formatting", () => {
  it("joins with en and of, writes Dutch dates, a decimal comma and the market wording", () => {
    expect(joinList("nl", ["Signal", "Telegram", "e-mail"])).toBe("Signal, Telegram en e-mail");
    expect(joinList("nl", ["Signal", "e-mail"], "disjunction")).toBe("Signal of e-mail");
    expect(formatLongDate("nl", "2026-10-14")).toBe("14 oktober 2026");
    expect(formatDecimal("nl", "1.42")).toBe("1,42");
    expect(plural("nl", 1, { one: "1 netwerk", other: "1 netwerken" })).toBe("1 netwerk");
    expect(plural("nl", 3, { one: "x", other: "3 netwerken" })).toBe("3 netwerken");
    expect(nlOnMarket("Arbitrum")).toBe("op Arbitrum");
    expect(nlOnMarket("Ethereum (V4 Lido)")).toBe("op de markt Ethereum (V4 Lido)");
    expect(nlOnMarket("Base", "network")).toBe("op Base");
    expect(nlForMarket("Base")).toBe("voor Base");
    expect(nlForMarket("USDC | cbBTC (86%)", "market")).toBe("voor de markt USDC | cbBTC (86%)");
  });
});

describe("Romanian formatting", () => {
  it("joins with și and sau, writes Romanian dates, a decimal comma, one/few/other plurals and the market wording", () => {
    expect(joinList("ro", ["Signal", "Telegram", "e-mail"])).toBe("Signal, Telegram și e-mail");
    expect(joinList("ro", ["Signal", "e-mail"], "disjunction")).toBe("Signal sau e-mail");
    expect(formatLongDate("ro", "2026-10-14")).toBe("14 octombrie 2026");
    expect(formatDecimal("ro", "1.42")).toBe("1,42");
    const networks = (n: number) => plural("ro", n, { one: `${n} rețea`, few: `${n} rețele`, other: `${n} de rețele` });
    expect(networks(1)).toBe("1 rețea");
    expect(networks(3)).toBe("3 rețele");
    expect(networks(19)).toBe("19 rețele");
    expect(networks(29)).toBe("29 de rețele");
    expect(roOnMarket("Arbitrum")).toBe("pe Arbitrum");
    expect(roOnMarket("Ethereum (V4 Lido)")).toBe("pe piața Ethereum (V4 Lido)");
    expect(roOnMarket("Base", "network")).toBe("pe Base");
    expect(roForMarket("Base")).toBe("pentru Base");
    expect(roForMarket("USDC | cbBTC (86%)", "market")).toBe("pentru piața USDC | cbBTC (86%)");
  });
});

describe("Hungarian formatting", () => {
  it("joins with és and vagy, writes Hungarian dates, a decimal comma, a singular noun after a number and the market wording", () => {
    expect(joinList("hu", ["Signal", "Telegram", "e-mail"])).toBe("Signal, Telegram és e-mail");
    expect(joinList("hu", ["Signal", "e-mail"], "disjunction")).toBe("Signal vagy e-mail");
    expect(formatLongDate("hu", "2026-10-14")).toBe("2026. október 14.");
    expect(formatDecimal("hu", "1.42")).toBe("1,42");
    const networks = (n: number) => plural("hu", n, { one: `${n} hálózat`, other: `${n} hálózat` });
    expect(networks(1)).toBe("1 hálózat");
    expect(networks(29)).toBe("29 hálózat");
    expect(huOnMarket("Arbitrum")).toBe("az Arbitrum hálózaton");
    expect(huOnMarket("Polygon")).toBe("a Polygon hálózaton");
    expect(huOnMarket("Ethereum (V4 Lido)")).toBe("az Ethereum (V4 Lido) piacon");
    expect(huOnMarket("Base", "network")).toBe("a Base hálózaton");
    expect(huForMarket("Base")).toBe("a Base hálózatra");
    expect(huForMarket("Base (V4 Coinbase Stocks)")).toBe("a Base (V4 Coinbase Stocks) piacra");
    expect(huForMarket("USDC | cbBTC (86%)", "market")).toBe("az USDC | cbBTC (86%) piacra");
  });

  it("picks az before a vowel sound, spelled-out letters included", () => {
    expect(huArticle("Ethereum (Core)")).toBe("az");
    expect(huArticle("Ink")).toBe("az");
    expect(huArticle("X Layer")).toBe("az");
    expect(huArticle("LBTC/USDC (86%)")).toBe("az");
    expect(huArticle("BNB Chain")).toBe("a");
    expect(huArticle("ZKsync")).toBe("a");
    expect(huArticle("MegaETH")).toBe("a");
    expect(huArticle("wstETH/WETH (94.5%)")).toBe("a");
  });
});

describe("Croatian formatting", () => {
  it("joins with i and ili, writes Croatian dates, a decimal comma, one/few/other plurals and the market wording", () => {
    expect(joinList("hr", ["Signal", "Telegram", "e-pošta"])).toBe("Signal, Telegram i e-pošta");
    expect(joinList("hr", ["Signal", "e-pošta"], "disjunction")).toBe("Signal ili e-pošta");
    expect(formatLongDate("hr", "2026-10-14")).toBe("14. listopada 2026.");
    expect(formatDecimal("hr", "1.42")).toBe("1,42");
    const networks = (n: number) => plural("hr", n, { one: `${n} mreža`, few: `${n} mreže`, other: `${n} mreža` });
    expect(networks(1)).toBe("1 mreža");
    expect(networks(2)).toBe("2 mreže");
    expect(networks(5)).toBe("5 mreža");
    expect(networks(21)).toBe("21 mreža");
    expect(networks(22)).toBe("22 mreže");
    expect(networks(29)).toBe("29 mreža");
    expect(hrOnMarket("Arbitrum")).toBe("na mreži Arbitrum");
    expect(hrOnMarket("Ethereum (V4 Lido)")).toBe("na tržištu Ethereum (V4 Lido)");
    expect(hrOnMarket("Base", "network")).toBe("na mreži Base");
    expect(hrForMarket("Base")).toBe("za mrežu Base");
    expect(hrForMarket("Base (V4 Coinbase Stocks)")).toBe("za tržište Base (V4 Coinbase Stocks)");
    expect(hrForMarket("USDC | cbBTC (86%)", "market")).toBe("za tržište USDC | cbBTC (86%)");
  });
});

describe("hrSrChannelsGenitive", () => {
  it("puts the joined channel names in the genitive, for after putem or preko", () => {
    expect(hrSrChannelsGenitive("Signal, Telegram i e-pošta")).toBe("Signala, Telegrama i e-pošte");
    expect(hrSrChannelsGenitive("Signal ili e-pošta")).toBe("Signala ili e-pošte");
  });
});

describe("Slovenian formatting", () => {
  it("joins with in and ali, writes Slovenian dates, a decimal comma, the dual and the market wording", () => {
    expect(joinList("sl", ["Signal", "Telegram", "e-pošta"])).toBe("Signal, Telegram in e-pošta");
    expect(joinList("sl", ["Signal", "e-pošta"], "disjunction")).toBe("Signal ali e-pošta");
    expect(formatLongDate("sl", "2026-10-14")).toBe("14. oktober 2026");
    expect(formatDecimal("sl", "1.42")).toBe("1,42");
    const networks = (n: number) =>
      plural("sl", n, { one: `${n} omrežje`, two: `${n} omrežji`, few: `${n} omrežja`, other: `${n} omrežij` });
    expect(networks(1)).toBe("1 omrežje");
    expect(networks(2)).toBe("2 omrežji");
    expect(networks(3)).toBe("3 omrežja");
    expect(networks(29)).toBe("29 omrežij");
    expect(networks(101)).toBe("101 omrežje");
    expect(networks(102)).toBe("102 omrežji");
    expect(slOnMarket("Arbitrum")).toBe("na omrežju Arbitrum");
    expect(slOnMarket("Ethereum (V4 Lido)")).toBe("na trgu Ethereum (V4 Lido)");
    expect(slOnMarket("Base", "network")).toBe("na omrežju Base");
    expect(slForMarket("Base")).toBe("za omrežje Base");
    expect(slForMarket("Base (V4 Coinbase Stocks)")).toBe("za trg Base (V4 Coinbase Stocks)");
    expect(slForMarket("USDC | cbBTC (86%)", "market")).toBe("za trg USDC | cbBTC (86%)");
  });
});

describe("Serbian formatting", () => {
  it("joins with i and ili, writes Serbian dates, a decimal comma, the plurals and the market wording", () => {
    expect(joinList("sr", ["Signal", "Telegram", "e-pošta"])).toBe("Signal, Telegram i e-pošta");
    expect(joinList("sr", ["Signal", "e-pošta"], "disjunction")).toBe("Signal ili e-pošta");
    expect(formatLongDate("sr", "2026-10-14")).toBe("14. oktobar 2026.");
    expect(formatDecimal("sr", "1.42")).toBe("1,42");
    const networks = (n: number) => plural("sr", n, { one: `${n} mreža`, few: `${n} mreže`, other: `${n} mreža` });
    expect(networks(1)).toBe("1 mreža");
    expect(networks(2)).toBe("2 mreže");
    expect(networks(5)).toBe("5 mreža");
    expect(networks(21)).toBe("21 mreža");
    expect(networks(22)).toBe("22 mreže");
    expect(networks(29)).toBe("29 mreža");
    expect(srOnMarket("Arbitrum")).toBe("na mreži Arbitrum");
    expect(srOnMarket("Ethereum (V4 Lido)")).toBe("na tržištu Ethereum (V4 Lido)");
    expect(srOnMarket("Base", "network")).toBe("na mreži Base");
    expect(srForMarket("Base")).toBe("za mrežu Base");
    expect(srForMarket("Base (V4 Coinbase Stocks)")).toBe("za tržište Base (V4 Coinbase Stocks)");
    expect(srForMarket("USDC | cbBTC (86%)", "market")).toBe("za tržište USDC | cbBTC (86%)");
  });
});

describe("Swedish formatting", () => {
  it("joins with och and eller, writes Swedish dates, a decimal comma, one/other plurals and the market wording", () => {
    expect(joinList("sv", ["Signal", "Telegram", "e-post"])).toBe("Signal, Telegram och e-post");
    expect(joinList("sv", ["Signal", "e-post"], "disjunction")).toBe("Signal eller e-post");
    expect(formatLongDate("sv", "2026-10-14")).toBe("14 oktober 2026");
    expect(formatDecimal("sv", "1.42")).toBe("1,42");
    const networks = (n: number) => plural("sv", n, { one: `${n} nätverk`, other: `${n} nätverk (other)` });
    expect(networks(1)).toBe("1 nätverk");
    expect(networks(2)).toBe("2 nätverk (other)");
    expect(svOnMarket("Arbitrum")).toBe("på Arbitrum");
    expect(svOnMarket("Ethereum (V4 Lido)")).toBe("på marknaden Ethereum (V4 Lido)");
    expect(svOnMarket("Base", "network")).toBe("på Base");
    expect(svForMarket("Base")).toBe("för Base");
    expect(svForMarket("Base (V4 Coinbase Stocks)")).toBe("för marknaden Base (V4 Coinbase Stocks)");
    expect(svForMarket("USDC | cbBTC (86%)", "market")).toBe("för marknaden USDC | cbBTC (86%)");
  });
});

describe("Danish formatting", () => {
  it("joins with og and eller, writes Danish dates, a decimal comma, one/other plurals and the market wording", () => {
    expect(joinList("da", ["Signal", "Telegram", "e-mail"])).toBe("Signal, Telegram og e-mail");
    expect(joinList("da", ["Signal", "e-mail"], "disjunction")).toBe("Signal eller e-mail");
    expect(formatLongDate("da", "2026-10-14")).toBe("14. oktober 2026");
    expect(formatDecimal("da", "1.42")).toBe("1,42");
    const networks = (n: number) => plural("da", n, { one: `${n} netværk`, other: `${n} netværk (other)` });
    expect(networks(1)).toBe("1 netværk");
    expect(networks(2)).toBe("2 netværk (other)");
    expect(daOnMarket("Arbitrum")).toBe("på Arbitrum");
    expect(daOnMarket("Ethereum (V4 Lido)")).toBe("på markedet Ethereum (V4 Lido)");
    expect(daOnMarket("Base", "network")).toBe("på Base");
    expect(daForMarket("Base")).toBe("for Base");
    expect(daForMarket("Base (V4 Coinbase Stocks)")).toBe("for markedet Base (V4 Coinbase Stocks)");
    expect(daForMarket("USDC | cbBTC (86%)", "market")).toBe("for markedet USDC | cbBTC (86%)");
  });
});

describe("Norwegian formatting", () => {
  it("joins with og and eller, writes Norwegian dates, a decimal comma, one/other plurals and the market wording", () => {
    expect(joinList("nb", ["Signal", "Telegram", "e-post"])).toBe("Signal, Telegram og e-post");
    expect(joinList("nb", ["Signal", "e-post"], "disjunction")).toBe("Signal eller e-post");
    expect(formatLongDate("nb", "2026-10-14")).toBe("14. oktober 2026");
    expect(formatDecimal("nb", "1.42")).toBe("1,42");
    const networks = (n: number) => plural("nb", n, { one: `${n} nettverk`, other: `${n} nettverk (other)` });
    expect(networks(1)).toBe("1 nettverk");
    expect(networks(2)).toBe("2 nettverk (other)");
    expect(nbOnMarket("Arbitrum")).toBe("på Arbitrum");
    expect(nbOnMarket("Ethereum (V4 Lido)")).toBe("på markedet Ethereum (V4 Lido)");
    expect(nbOnMarket("Base", "network")).toBe("på Base");
    expect(nbForMarket("Base")).toBe("for Base");
    expect(nbForMarket("Base (V4 Coinbase Stocks)")).toBe("for markedet Base (V4 Coinbase Stocks)");
    expect(nbForMarket("USDC | cbBTC (86%)", "market")).toBe("for markedet USDC | cbBTC (86%)");
  });
});

describe("Filipino formatting", () => {
  it("joins with at and o, writes Filipino dates, a decimal point, the same noun after any number and the market wording", () => {
    expect(joinList("fil", ["Signal", "Telegram", "email"])).toBe("Signal, Telegram at email");
    expect(joinList("fil", ["Signal", "email"], "disjunction")).toBe("Signal o email");
    expect(formatLongDate("fil", "2026-10-14")).toBe("Oktubre 14, 2026");
    expect(formatDecimal("fil", "1.42")).toBe("1.42");
    // CLDR one covers 1, 2, 3, 5...; other covers 4, 6, 9... The noun does not change, so both forms read the same.
    const networks = (n: number) => plural("fil", n, { one: `${n} network (one)`, other: `${n} network (other)` });
    expect(networks(1)).toBe("1 network (one)");
    expect(networks(4)).toBe("4 network (other)");
    expect(filOnMarket("Arbitrum")).toBe("sa Arbitrum");
    expect(filOnMarket("Ethereum (V4 Lido)")).toBe("sa market na Ethereum (V4 Lido)");
    expect(filOnMarket("Base", "network")).toBe("sa Base");
    expect(filForMarket("Base")).toBe("para sa Base");
    expect(filForMarket("Base (V4 Coinbase Stocks)")).toBe("para sa market na Base (V4 Coinbase Stocks)");
    expect(filForMarket("USDC | cbBTC (86%)", "market")).toBe("para sa market na USDC | cbBTC (86%)");
  });
});

describe("Bulgarian formatting", () => {
  it("joins with и and или, writes Bulgarian dates, a decimal comma, one/other plurals and the market wording", () => {
    expect(joinList("bg", ["Signal", "Telegram", "имейл"])).toBe("Signal, Telegram и имейл");
    expect(joinList("bg", ["Signal", "имейл"], "disjunction")).toBe("Signal или имейл");
    expect(formatLongDate("bg", "2026-10-14")).toBe("14 октомври 2026 г.");
    expect(formatDecimal("bg", "1.42")).toBe("1,42");
    const networks = (n: number) => plural("bg", n, { one: `${n} мрежа`, other: `${n} мрежи` });
    expect(networks(1)).toBe("1 мрежа");
    expect(networks(5)).toBe("5 мрежи");
    expect(networks(21)).toBe("21 мрежи");
    expect(bgOnMarket("Arbitrum")).toBe("в мрежата Arbitrum");
    expect(bgOnMarket("Ethereum (V4 Lido)")).toBe("на пазара Ethereum (V4 Lido)");
    expect(bgOnMarket("Base", "network")).toBe("в мрежата Base");
    expect(bgForMarket("Base")).toBe("за мрежата Base");
    expect(bgForMarket("Base (V4 Coinbase Stocks)")).toBe("за пазара Base (V4 Coinbase Stocks)");
    expect(bgForMarket("USDC | cbBTC (86%)", "market")).toBe("за пазара USDC | cbBTC (86%)");
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
