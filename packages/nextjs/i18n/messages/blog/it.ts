import type { BlogMessages } from "./shared";
import { formatDecimal, plural } from "~~/i18n/format";

/** "ogni 5 minuti", "ogni minuto". */
const itEveryMinutes = (minutes: number) =>
  plural("it", minutes, { one: "ogni minuto", many: `ogni ${minutes} minuti`, other: `ogni ${minutes} minuti` });

/** "su 22 reti", "su 1 rete". */
const itOnNetworks = (networks: number) =>
  plural("it", networks, { one: `su ${networks} rete`, many: `su ${networks} reti`, other: `su ${networks} reti` });

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Home", blog: "Blog" },
  index: {
    title: "Guide su Aave e Morpho: fattore di salute e liquidazione",
    description:
      "Guide sul fattore di salute di Aave e Morpho, la liquidazione, il prezzo di liquidazione e gli avvisi, con esempi svolti e dati datati e con fonte.",
    kicker: "Guide su Aave e Morpho",
    lead: "Come funziona il fattore di salute su Aave e su Morpho, cosa succede in una liquidazione, come calcolare il tuo prezzo di liquidazione e come essere avvisato prima che il prezzo ci si avvicini. Ogni dato di queste guide indica la sua fonte e la data in cui è stato verificato.",
    dashboardCta: "Apri la dashboard Aave",
    morphoDashboardCta: "Apri la dashboard Morpho",
    rss: "Iscriviti via RSS",
    startHere: "Inizia da qui",
    allGuides: "Tutte le guide",
    empty: {
      title: "Ancora nessuna guida",
      description: "Stiamo preparando le guide in italiano. Iscriviti via RSS per riceverle appena vengono pubblicate.",
      otherLanguage: "Leggi le guide in inglese",
    },
  },
  post: {
    kicker: "Guida su Aave V3",
    morphoKicker: "Guida su Morpho",
    byline: { author: "Dal team di Tokenping", published: "Pubblicato il", updated: "Aggiornato il" },
    readingTime: minutes => `${minutes} min di lettura`,
    readGuide: "Leggi la guida",
    related: "Guide correlate",
  },
  endBox: {
    label: "Informazioni su Tokenping",
    title: "Avvisi sul fattore di salute da Tokenping",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tokenping controlla il fattore di salute delle tue posizioni Aave V3 e V4 ${itEveryMinutes(minutes)} ${itOnNetworks(networks)} e ti scrive via ${channels} quando scende sotto la tua soglia. Gli avvisi costano ${price}${paymentChain ? `, da pagare su ${paymentChain}` : ""}; vedere le posizioni non richiede pagamenti. Gli avvisi ti danno il tempo di agire, ma non impediscono la liquidazione.`,
    cta: "Apri la dashboard",
    morpho: {
      title: "Avvisi sul fattore di salute Morpho da Tokenping",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping controlla il fattore di salute dei tuoi prestiti Morpho Blue e Midnight ${itEveryMinutes(minutes)} ${itOnNetworks(networks)} e ti scrive via ${channels} quando scende sotto la tua soglia, con promemoria prima della scadenza di un prestito a tasso fisso. Gli avvisi costano ${price}${paymentChain ? `, da pagare su ${paymentChain}` : ""}, lo stesso piano degli avvisi Aave; vedere le posizioni non richiede pagamenti. Gli avvisi ti danno il tempo di agire, ma non impediscono la liquidazione.`,
      cta: "Apri la dashboard Morpho",
    },
  },
  alertPrice: {
    fallback: "una piccola commissione in USDC (il prezzo attuale è indicato nella dashboard)",
    plan: ({ priceLabel, days }) =>
      `${formatDecimal("it", priceLabel)} ${plural("it", days, { one: "al giorno", many: `ogni ${days} giorni`, other: `ogni ${days} giorni` })}`,
  },
  callout: { info: "Nota", warning: "Attenzione" },
  shortAnswer: "In breve",
  scopeNote: {
    text: "Vale per Aave V3.7, verificato sui mercati Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche e Gnosis. Altri mercati e reti V3 potrebbero usare versioni precedenti. Le differenze di Aave V4 sono indicate dove le regole cambiano.",
    morphoText:
      "Vale per i mercati Morpho Blue e Morpho Midnight elencati nell'app Morpho. Ogni mercato stabilisce il proprio collaterale, oracolo e LLTV, quindi verifica i dati del tuo.",
    figuresAsOf: "Dati aggiornati al",
  },
  table: {
    fallbackLabel: "Tabella, scorre in orizzontale",
    label: (heading, index) => (index === undefined ? `Tabella: ${heading}` : `Tabella ${index}: ${heading}`),
    scrollHint: "Scorri di lato per vedere tutte le colonne.",
  },
};
