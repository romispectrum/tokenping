import type { NotificationMessages } from "./shared";
import { itOnMarket, plural } from "~~/i18n/format";

const maturityWindow = (stage: "7d" | "1d") => (stage === "7d" ? "7 giorni" : "24 ore");

export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `Il tuo fattore di salute Aave ${itOnMarket(chainName)} è ${healthFactor}, ` +
    `sotto la tua soglia di ${threshold}. ` +
    `Valuta di aggiungere collaterale o rimborsare il debito per evitare la liquidazione.\n\nInviato: ${timestamp}`,
  alertSubject: chainName => `Avviso sul fattore di salute Aave - ${chainName}`,
  // The html footer says "Creato" where the text says "Inviato", as the English does.
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>Il tuo fattore di salute Aave ${itOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} è ` +
    `<strong>${healthFactor}</strong>, sotto la tua soglia di ` +
    `<strong>${threshold}</strong>.</p>` +
    `<p>Valuta di aggiungere collaterale o rimborsare il debito per evitare la liquidazione.</p>` +
    `<p><small>Creato: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "critico", risky: "a rischio", safe: "sicuro" };
    const now =
      position.kind === "debt"
        ? `Adesso: fattore di salute ${position.healthFactor} (${statusWord[position.status]}), collaterale ${position.collateral}, debito ${position.debt}.`
        : position.kind === "noDebt"
          ? `Adesso: nessun debito, quindi non c'è nulla da liquidare${position.collateral ? ` (collaterale ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Adesso: nessuna posizione aperta in questo mercato."
            : "Adesso: non è stato possibile leggere la tua posizione. Gli avvisi veri riprovano a ogni controllo.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "È sotto la tua soglia, quindi il prossimo controllo invierà un avviso vero."
          : "È sopra la tua soglia, quindi adesso non verrebbe inviato nessun avviso."
        : null;
    const every = plural("it", minutes, {
      one: "ogni minuto",
      many: `ogni ${minutes} minuti`,
      other: `ogni ${minutes} minuti`,
    });
    return [
      "Messaggio di prova da Tokenping: gli avvisi su questo canale funzionano.",
      `Il tuo avviso: ${chainName}, quando il fattore di salute scende sotto ${threshold}.`,
      now,
      ...(verdict ? [verdict] : []),
      `Controllo ${every}. Inviato: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Messaggio di prova di Tokenping - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (LLTV ${market.lltv})`
      : `${market.loan} a tasso fisso, scadenza ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Il tuo fattore di salute Morpho ${itOnMarket(chainName, "network")} è ${healthFactor}, sotto la tua soglia di ${threshold}.`,
    `Mercato: ${market}.`,
    ...(preLiquidation
      ? [
          "Hai attivato la pre-liquidazione (pre-liquidation) su questo mercato, quindi il fattore di salute si misura sulla sua soglia anticipata: sotto 1, una parte della tua posizione può essere venduta.",
        ]
      : []),
    "Valuta di aggiungere collaterale o rimborsare il debito per evitare la liquidazione.",
    `Inviato: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Avviso sul fattore di salute Morpho - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Il tuo prestito Morpho a tasso fisso ${itOnMarket(chainName, "network")} è arrivato a scadenza il ${when} e ha ancora ${debt} di debito.`,
          `Mercato: ${market}.`,
          "Ora può essere liquidato in qualsiasi momento, qualunque sia il suo fattore di salute. Rimborsalo per evitare la liquidazione.",
          `Inviato: ${timestamp}`,
        ]
      : [
          `Il tuo prestito Morpho a tasso fisso ${itOnMarket(chainName, "network")} scade entro ${maturityWindow(stage)}, il ${when}.`,
          `Mercato: ${market}.`,
          `Debito: ${debt}.`,
          "Dopo la scadenza, il debito non rimborsato può essere liquidato: rimborsalo prima.",
          `Inviato: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Prestito Morpho scaduto - ${chainName}`
      : `Prestito Morpho in scadenza entro ${maturityWindow(stage)} - ${chainName}`,
};
