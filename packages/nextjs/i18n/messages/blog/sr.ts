import type { BlogMessages } from "./shared";
// The alert price ("3 USDC za 30 dana" or the fallback) stands where the nominative reads: "Cena upozorenja: ...".
import { formatDecimal, hrSrChannelsGenitive, plural, srOnMarket } from "~~/i18n/format";

/** "svakih 5 minuta", "svaka 2 minuta", "svakog minuta" (minut is masculine in Serbian). */
const everyMinutes = (minutes: number) =>
  minutes === 1
    ? "svakog minuta"
    : plural("sr", minutes, {
        one: `svaki ${minutes} minut`,
        few: `svaka ${minutes} minuta`,
        other: `svakih ${formatDecimal("sr", minutes)} minuta`,
      });

/** "na 29 mreža", "na 22 mreže", "na 21 mreži". */
const onNetworks = (networks: number) =>
  plural("sr", networks, {
    one: `na ${networks} mreži`,
    few: `na ${networks} mreže`,
    other: `na ${networks} mreža`,
  });

/** "dnevno", "za 30 dana", "za 21 dan". */
const forDays = (days: number) =>
  days === 1
    ? "dnevno"
    : plural("sr", days, {
        one: `za ${days} dan`,
        few: `za ${days} dana`,
        other: `za ${formatDecimal("sr", days)} dana`,
      });

/** ", plaćanje na mreži Arbitrum", or nothing when no network takes payments. */
const paidOn = (paymentChain?: string) => (paymentChain ? `, plaćanje ${srOnMarket(paymentChain, "network")}` : "");

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Početna", blog: "Blog" },
  index: {
    title: "Vodiči za health factor i likvidacije na Aave i Morpho",
    description:
      "Vodiči za health factor na protokolima Aave i Morpho, likvidacije, likvidacione cene i upozorenja, uz razrađene primere i datirane podatke sa izvorima.",
    kicker: "Vodiči za Aave i Morpho",
    lead: "Kako health factor radi na protokolu Aave i na protokolu Morpho, šta se dešava pri likvidaciji, kako da izračunaš svoju likvidacionu cenu i kako da dobiješ upozorenje pre nego što joj se cena približi. Svaki podatak u ovim vodičima navodi svoj izvor i datum kada je proveren.",
    dashboardCta: "Otvori kontrolnu tablu za Aave",
    morphoDashboardCta: "Otvori kontrolnu tablu za Morpho",
    rss: "Pretplati se preko RSS-a",
    startHere: "Počni ovde",
    allGuides: "Svi vodiči",
    empty: {
      title: "Još nema vodiča",
      description: "Srpske verzije vodiča su u izradi. Pretplati se preko RSS-a i dobićeš ih čim budu objavljene.",
      otherLanguage: "Čitaj vodiče na engleskom",
    },
  },
  post: {
    kicker: "Vodič za Aave V3",
    morphoKicker: "Vodič za Morpho",
    byline: { author: "Tim Tokenpinga", published: "Objavljeno", updated: "Ažurirano" },
    readingTime: minutes => `${minutes} min čitanja`,
    readGuide: "Pročitaj vodič",
    related: "Povezani vodiči",
  },
  endBox: {
    label: "O Tokenpingu",
    title: "Upozorenja za health factor od Tokenpinga",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tokenping proverava tvoj health factor na protokolu Aave V3 i V4 ${everyMinutes(minutes)} ${onNetworks(networks)} i šalje ti poruku preko ${hrSrChannelsGenitive(channels)} kad padne ispod tvog praga. Cena upozorenja: ${price}${paidOn(paymentChain)}; pregled pozicija ne košta ništa. Upozorenja ti daju vremena da reaguješ, ali ne sprečavaju likvidaciju.`,
    cta: "Otvori kontrolnu tablu",
    morpho: {
      title: "Upozorenja za health factor na protokolu Morpho od Tokenpinga",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping proverava tvoj health factor na protokolu Morpho Blue i Midnight ${everyMinutes(minutes)} ${onNetworks(networks)} i šalje ti poruku preko ${hrSrChannelsGenitive(channels)} kad padne ispod tvog praga, uz podsetnike pre dospeća zajma s fiksnom kamatom. Cena upozorenja: ${price}${paidOn(paymentChain)}, isti plan kao za upozorenja na protokolu Aave; pregled pozicija ne košta ništa. Upozorenja ti daju vremena da reaguješ, ali ne sprečavaju likvidaciju.`,
      cta: "Otvori kontrolnu tablu za Morpho",
    },
  },
  alertPrice: {
    fallback: "mala naknada u USDC (trenutnu cenu vidiš na kontrolnoj tabli)",
    plan: ({ priceLabel, days }) => `${formatDecimal("sr", priceLabel)} ${forDays(days)}`,
  },
  callout: { info: "Napomena", warning: "Upozorenje" },
  shortAnswer: "Kratak odgovor",
  scopeNote: {
    text: "Odnosi se na Aave V3.7, provereno na tržištima Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche i Gnosis. Ostala V3 tržišta i mreže možda rade na starijim verzijama. Razlike u verziji Aave V4 navedene su tamo gde se pravila razlikuju.",
    morphoText:
      "Odnosi se na tržišta Morpho Blue i Morpho Midnight navedena u aplikaciji Morpho. Svako tržište ima sopstveni kolateral, orakl i LLTV, pa proveri podatke svog tržišta.",
    figuresAsOf: "Podaci na dan",
  },
  table: {
    fallbackLabel: "Tabela, pomera se vodoravno",
    label: (heading, index) => (index === undefined ? `Tabela: ${heading}` : `Tabela ${index}: ${heading}`),
    scrollHint: "Pomeri u stranu da vidiš sve kolone.",
  },
};
