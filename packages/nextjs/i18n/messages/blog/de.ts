import type { BlogMessages } from "./shared";
import { formatDecimal, plural } from "~~/i18n/format";

/** "alle 5 Minuten", "jede Minute". */
const deEveryMinutes = (minutes: number) =>
  plural("de", minutes, { one: "jede Minute", other: `alle ${minutes} Minuten` });

/** "in 22 Netzwerken", "in 1 Netzwerk". */
const deOnNetworks = (networks: number) =>
  plural("de", networks, { one: `in ${networks} Netzwerk`, other: `in ${networks} Netzwerken` });

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Startseite", blog: "Blog" },
  index: {
    title: "Ratgeber: Health Factor und Liquidation bei Aave und Morpho",
    description:
      "Ratgeber zum Health Factor bei Aave und Morpho, zu Liquidationen, Liquidationspreisen und Alerts, mit Rechenbeispielen und datierten Zahlen mit Quelle.",
    kicker: "Ratgeber zu Aave und Morpho",
    lead: "Wie der Health Factor bei Aave und bei Morpho funktioniert, was bei einer Liquidation passiert, wie du deinen Liquidationspreis berechnest und wie du gewarnt wirst, bevor der Preis ihm nahe kommt. Jede Zahl in diesen Ratgebern nennt ihre Quelle und das Datum, an dem sie geprüft wurde.",
    dashboardCta: "Aave-Dashboard öffnen",
    morphoDashboardCta: "Morpho-Dashboard öffnen",
    rss: "Per RSS abonnieren",
    startHere: "Für den Einstieg",
    allGuides: "Alle Ratgeber",
    empty: {
      title: "Noch keine Ratgeber",
      description:
        "Wir bereiten die Ratgeber auf Deutsch vor. Abonniere sie per RSS, um sie zu erhalten, sobald sie erscheinen.",
      otherLanguage: "Ratgeber auf Englisch lesen",
    },
  },
  post: {
    kicker: "Ratgeber zu Aave V3",
    morphoKicker: "Ratgeber zu Morpho",
    byline: { author: "Vom Tokenping-Team", published: "Veröffentlicht", updated: "Aktualisiert" },
    readingTime: minutes => `${minutes} Min. Lesezeit`,
    readGuide: "Ratgeber lesen",
    related: "Verwandte Ratgeber",
  },
  endBox: {
    label: "Über Tokenping",
    title: "Health-Factor-Alerts von Tokenping",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tokenping prüft den Health Factor deiner Positionen auf Aave V3 und V4 ${deEveryMinutes(minutes)} ${deOnNetworks(networks)} und schreibt dir über ${channels}, wenn er unter deinem Schwellenwert liegt. Alerts kosten ${price}${paymentChain ? `, bezahlt im Netzwerk ${paymentChain}` : ""}; deine Positionen anzusehen braucht keine Zahlung. Alerts geben dir Zeit zu handeln; eine Liquidation verhindern sie nicht.`,
    cta: "Dashboard öffnen",
    morpho: {
      title: "Health-Factor-Alerts für Morpho von Tokenping",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping prüft den Health Factor deiner Kredite auf Morpho Blue und Midnight ${deEveryMinutes(minutes)} ${deOnNetworks(networks)} und schreibt dir über ${channels}, wenn er unter deinem Schwellenwert liegt, mit Erinnerungen vor der Fälligkeit eines Kredits mit festem Zinssatz. Alerts kosten ${price}${paymentChain ? `, bezahlt im Netzwerk ${paymentChain}` : ""}, derselbe Plan wie für Aave-Alerts; deine Positionen anzusehen braucht keine Zahlung. Alerts geben dir Zeit zu handeln; eine Liquidation verhindern sie nicht.`,
      cta: "Morpho-Dashboard öffnen",
    },
  },
  alertPrice: {
    fallback: "eine kleine Gebühr in USDC (den aktuellen Preis siehst du im Dashboard)",
    plan: ({ priceLabel, days }) =>
      `${formatDecimal("de", priceLabel)} ${plural("de", days, { one: "pro Tag", other: `für ${days} Tage` })}`,
  },
  callout: { info: "Hinweis", warning: "Warnung" },
  shortAnswer: "Kurze Antwort",
  scopeNote: {
    text: "Gilt für Aave V3.7, geprüft in den Märkten Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche und Gnosis. Andere V3-Märkte und Netzwerke laufen eventuell mit älteren Versionen. Unterschiede bei Aave V4 sind dort vermerkt, wo die Regeln abweichen.",
    morphoText:
      "Gilt für die Märkte von Morpho Blue und Morpho Midnight, die in der Morpho-App gelistet sind. Jeder Markt legt seine eigenen Sicherheiten, sein Orakel und seine LLTV fest, prüfe also die Zahlen deines Markts.",
    figuresAsOf: "Stand der Zahlen:",
  },
  table: {
    fallbackLabel: "Tabelle, horizontal scrollbar",
    label: (heading, index) => (index === undefined ? `Tabelle: ${heading}` : `Tabelle ${index}: ${heading}`),
    scrollHint: "Scrolle seitwärts, um alle Spalten zu sehen.",
  },
};
