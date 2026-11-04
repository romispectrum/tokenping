import type { BlogMessages } from "./shared";
import { formatDecimal, plural } from "~~/i18n/format";

/** "la fiecare 5 minute", "la fiecare minut", "la fiecare 30 de minute". */
const roEveryMinutes = (minutes: number) =>
  plural("ro", minutes, {
    one: "la fiecare minut",
    few: `la fiecare ${minutes} minute`,
    other: `la fiecare ${minutes} de minute`,
  });

/** "pe 1 rețea", "pe 12 rețele", "pe 29 de rețele". */
const roOnNetworks = (networks: number) =>
  plural("ro", networks, {
    one: `pe ${networks} rețea`,
    few: `pe ${networks} rețele`,
    other: `pe ${networks} de rețele`,
  });

/** "pe zi", "la fiecare 30 de zile". */
const roPerDays = (days: number) =>
  plural("ro", days, { one: "pe zi", few: `la fiecare ${days} zile`, other: `la fiecare ${days} de zile` });

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Acasă", blog: "Blog" },
  index: {
    title: "Ghiduri despre health factor și lichidare pe Aave și Morpho",
    description:
      "Ghiduri despre health factor pe Aave și Morpho, lichidări, prețuri de lichidare și alerte, cu exemple de calcul și cifre datate, cu surse.",
    kicker: "Ghiduri despre Aave și Morpho",
    lead: "Cum funcționează health factor-ul pe Aave și pe Morpho, ce se întâmplă la o lichidare, cum îți calculezi prețul de lichidare și cum primești un avertisment înainte să se apropie. Fiecare cifră din aceste ghiduri își numește sursa și data la care a fost verificată.",
    dashboardCta: "Deschide panoul Aave",
    morphoDashboardCta: "Deschide panoul Morpho",
    rss: "Abonează-te prin RSS",
    startHere: "Începe de aici",
    allGuides: "Toate ghidurile",
    empty: {
      title: "Niciun ghid deocamdată",
      description:
        "Ghidurile în limba română sunt în pregătire. Abonează-te prin RSS ca să le primești când sunt publicate.",
      otherLanguage: "Citește ghidurile în engleză",
    },
  },
  post: {
    kicker: "Ghid despre Aave V3",
    morphoKicker: "Ghid despre Morpho",
    byline: { author: "De echipa Tokenping", published: "Publicat", updated: "Actualizat" },
    readingTime: minutes => `${minutes} min de citit`,
    readGuide: "Citește ghidul",
    related: "Ghiduri înrudite",
  },
  endBox: {
    label: "Despre Tokenping",
    title: "Alerte de health factor de la Tokenping",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tokenping verifică health factor-ul pozițiilor tale pe Aave V3 și V4 ${roEveryMinutes(minutes)} ${roOnNetworks(networks)} și îți trimite un mesaj prin ${channels} când scade sub pragul tău. Alertele costă ${price}${paymentChain ? `, plătite pe ${paymentChain}` : ""}; vizualizarea pozițiilor nu costă nimic. Alertele îți dau timp să acționezi; nu împiedică lichidarea.`,
    cta: "Deschide panoul",
    morpho: {
      title: "Alerte de health factor pentru Morpho de la Tokenping",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping verifică health factor-ul împrumuturilor tale pe Morpho Blue și Midnight ${roEveryMinutes(minutes)} ${roOnNetworks(networks)} și îți trimite un mesaj prin ${channels} când scade sub pragul tău, cu mementouri înainte de scadența unui împrumut cu dobândă fixă. Alertele costă ${price}${paymentChain ? `, plătite pe ${paymentChain}` : ""}, același plan ca alertele pentru Aave; vizualizarea pozițiilor nu costă nimic. Alertele îți dau timp să acționezi; nu împiedică lichidarea.`,
      cta: "Deschide panoul Morpho",
    },
  },
  alertPrice: {
    fallback: "o taxă mică în USDC (prețul actual este afișat în panou)",
    plan: ({ priceLabel, days }) => `${formatDecimal("ro", priceLabel)} ${roPerDays(days)}`,
  },
  callout: { info: "Notă", warning: "Atenție" },
  shortAnswer: "Pe scurt",
  scopeNote: {
    text: "Se aplică pentru Aave V3.7, verificat pe piețele Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche și Gnosis. Alte piețe și rețele V3 pot rula versiuni mai vechi. Diferențele din Aave V4 sunt menționate acolo unde regulile diferă.",
    morphoText:
      "Se aplică pentru piețele Morpho Blue și Morpho Midnight listate în aplicația Morpho. Fiecare piață își stabilește propria garanție, propriul oracol și propriul LLTV, așa că verifică cifrele pieței tale.",
    figuresAsOf: "Cifre valabile la",
  },
  table: {
    fallbackLabel: "Tabel, se derulează orizontal",
    label: (heading, index) => (index === undefined ? `Tabel: ${heading}` : `Tabelul ${index}: ${heading}`),
    scrollHint: "Derulează lateral ca să vezi toate coloanele.",
  },
};
