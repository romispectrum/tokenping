import type { NotificationMessages } from "./shared";
import { plural, roOnMarket } from "~~/i18n/format";

const PRE_LIQUIDATION =
  "Ai ales pre-lichidarea pe această piață, așa că health factor-ul este măsurat față de pragul ei, atins mai devreme: sub 1, o parte din poziția ta poate fi vândută.";

// Read on a phone: short, plain sentences with the same facts as the English.
export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `Health factor-ul tău Aave ${roOnMarket(chainName)} este ${healthFactor}. ` +
    `Este sub pragul tău de ${threshold}. ` +
    `Ia în calcul să adaugi garanție sau să rambursezi datorie ca să eviți lichidarea.\n\nTrimis la: ${timestamp}`,
  alertSubject: chainName => `Alertă de health factor Aave - ${chainName}`,
  // The html footer says "Creat la" (created at) where the text says "Trimis la" (sent at).
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>Health factor-ul tău Aave ${roOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} este ` +
    `<strong>${healthFactor}</strong>. Este sub pragul tău de <strong>${threshold}</strong>.</p>` +
    `<p>Ia în calcul să adaugi garanție sau să rambursezi datorie ca să eviți lichidarea.</p>` +
    `<p><small>Creat la: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "critic", risky: "riscant", safe: "sigur" };
    const now =
      position.kind === "debt"
        ? `Acum: health factor ${position.healthFactor} (${statusWord[position.status]}), garanție ${position.collateral}, datorie ${position.debt}.`
        : position.kind === "noDebt"
          ? `Acum: nicio datorie, deci nu poate fi lichidat nimic${position.collateral ? ` (garanție ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Acum: nicio poziție deschisă pe această piață."
            : "Acum: poziția ta nu a putut fi citită. Alertele reale încearcă din nou la fiecare verificare.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "Este sub pragul tău, deci următoarea verificare trimite o alertă reală."
          : "Este peste pragul tău, deci acum nu s-ar trimite nicio alertă."
        : null;
    const every = plural("ro", minutes, {
      one: "în fiecare minut",
      few: `la fiecare ${minutes} minute`,
      other: `la fiecare ${minutes} de minute`,
    });
    return [
      "Mesaj de test de la Tokenping: alertele pe acest canal funcționează.",
      `Alerta ta: ${chainName}, când health factor-ul scade sub ${threshold}.`,
      now,
      ...(verdict ? [verdict] : []),
      `Verificare ${every}. Trimis la: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Mesaj de test Tokenping - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
      : `${market.loan} cu dobândă fixă, scadență ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Health factor-ul tău Morpho ${roOnMarket(chainName, "network")} este ${healthFactor}. Este sub pragul tău de ${threshold}.`,
    `Piață: ${market}.`,
    ...(preLiquidation ? [PRE_LIQUIDATION] : []),
    "Ia în calcul să adaugi garanție sau să rambursezi datorie ca să eviți lichidarea.",
    `Trimis la: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Alertă de health factor Morpho - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Împrumutul tău Morpho cu dobândă fixă ${roOnMarket(chainName, "network")} a ajuns la scadență pe ${when} și mai are o datorie de ${debt}.`,
          `Piață: ${market}.`,
          "Acum poate fi lichidat oricând, indiferent de health factor. Rambursează-l ca să eviți lichidarea.",
          `Trimis la: ${timestamp}`,
        ]
      : [
          `Împrumutul tău Morpho cu dobândă fixă ${roOnMarket(chainName, "network")} ajunge la scadență în următoarele ${stage === "7d" ? "7 zile" : "24 de ore"}, pe ${when}.`,
          `Piață: ${market}.`,
          `Datorie: ${debt}.`,
          "După scadență, orice datorie neplătită poate fi lichidată, așa că rambursează-o înainte.",
          `Trimis la: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Împrumut Morpho cu scadența depășită - ${chainName}`
      : `Împrumut Morpho cu scadența în următoarele ${stage === "7d" ? "7 zile" : "24 de ore"} - ${chainName}`,
};
