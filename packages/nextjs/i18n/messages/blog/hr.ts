import type { BlogMessages } from "./shared";
// The alert price ("3 USDC za 30 dana" or the fallback) stands where the nominative reads: "Cijena upozorenja: ...".
import { formatDecimal, hrOnMarket, plural } from "~~/i18n/format";

/** "svakih 5 minuta", "svake 2 minute", "svake minute". */
const everyMinutes = (minutes: number) =>
  minutes === 1
    ? "svake minute"
    : plural("hr", minutes, {
        one: `svakih ${minutes} minuta`,
        few: `svake ${minutes} minute`,
        other: `svakih ${formatDecimal("hr", minutes)} minuta`,
      });

/** "na 29 mreža", "na 22 mreže", "na 21 mreži". */
const onNetworks = (networks: number) =>
  plural("hr", networks, {
    one: `na ${networks} mreži`,
    few: `na ${networks} mreže`,
    other: `na ${networks} mreža`,
  });

/** "dnevno", "za 30 dana", "za 21 dan". */
const forDays = (days: number) =>
  days === 1
    ? "dnevno"
    : plural("hr", days, {
        one: `za ${days} dan`,
        few: `za ${days} dana`,
        other: `za ${formatDecimal("hr", days)} dana`,
      });

/** ", plaćanje na mreži Arbitrum", or nothing when no network takes payments. */
const paidOn = (paymentChain?: string) => (paymentChain ? `, plaćanje ${hrOnMarket(paymentChain, "network")}` : "");

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Početna", blog: "Blog" },
  index: {
    title: "Vodiči za health factor i likvidacije na Aaveu i Morphu",
    description:
      "Vodiči za health factor na Aaveu i Morphu, likvidacije, likvidacijske cijene i upozorenja, s razrađenim primjerima i datiranim podacima s izvorima.",
    kicker: "Vodiči za Aave i Morpho",
    lead: "Kako health factor radi na Aaveu i na Morphu, što se događa pri likvidaciji, kako izračunati svoju likvidacijsku cijenu i kako dobiti upozorenje prije nego što joj se cijena približi. Svaki podatak u ovim vodičima navodi svoj izvor i datum kad je provjeren.",
    dashboardCta: "Otvori nadzornu ploču za Aave",
    morphoDashboardCta: "Otvori nadzornu ploču za Morpho",
    rss: "Pretplati se putem RSS-a",
    startHere: "Počni ovdje",
    allGuides: "Svi vodiči",
    empty: {
      title: "Još nema vodiča",
      description: "Hrvatske verzije vodiča su u izradi. Pretplati se putem RSS-a i dobit ćeš ih čim budu objavljene.",
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
      `Tokenping provjerava tvoj health factor na Aaveu V3 i V4 ${everyMinutes(minutes)} ${onNetworks(networks)} i šalje ti poruku putem kanala ${channels} kad padne ispod tvog praga. Cijena upozorenja: ${price}${paidOn(paymentChain)}; pregled pozicija ne košta ništa. Upozorenja ti daju vremena da reagiraš, ali ne sprječavaju likvidaciju.`,
    cta: "Otvori nadzornu ploču",
    morpho: {
      title: "Upozorenja za health factor na Morphu od Tokenpinga",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping provjerava tvoj health factor na Morphu Blue i Midnight ${everyMinutes(minutes)} ${onNetworks(networks)} i šalje ti poruku putem kanala ${channels} kad padne ispod tvog praga, uz podsjetnike prije dospijeća zajma s fiksnom kamatom. Cijena upozorenja: ${price}${paidOn(paymentChain)}, isti plan kao za upozorenja na Aaveu; pregled pozicija ne košta ništa. Upozorenja ti daju vremena da reagiraš, ali ne sprječavaju likvidaciju.`,
      cta: "Otvori nadzornu ploču za Morpho",
    },
  },
  alertPrice: {
    fallback: "mala naknada u USDC-u (trenutačnu cijenu vidiš na nadzornoj ploči)",
    plan: ({ priceLabel, days }) => `${formatDecimal("hr", priceLabel)} ${forDays(days)}`,
  },
  callout: { info: "Napomena", warning: "Upozorenje" },
  shortAnswer: "Kratki odgovor",
  scopeNote: {
    text: "Odnosi se na Aave V3.7, provjereno na tržištima Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche i Gnosis. Ostala tržišta i mreže V3 možda rade na starijim verzijama. Razlike u Aaveu V4 navedene su ondje gdje se pravila razlikuju.",
    morphoText:
      "Odnosi se na tržišta Morpho Blue i Morpho Midnight navedena u aplikaciji Morpho. Svako tržište ima vlastiti kolateral, orakl i LLTV, pa provjeri podatke svojeg tržišta.",
    figuresAsOf: "Podaci na dan",
  },
  table: {
    fallbackLabel: "Tablica, pomiče se vodoravno",
    label: (heading, index) => (index === undefined ? `Tablica: ${heading}` : `Tablica ${index}: ${heading}`),
    scrollHint: "Pomakni u stranu da vidiš sve stupce.",
  },
};
