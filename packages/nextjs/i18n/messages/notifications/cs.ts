import type { NotificationMessages } from "./shared";
import { csOnMarket, plural } from "~~/i18n/format";

export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `Váš health factor na Aave ${csOnMarket(chainName)} je ${healthFactor}, ` +
    `což je pod vaším prahem ${threshold}. ` +
    `Zvažte doplnění kolaterálu nebo splacení dluhu, abyste se vyhnuli likvidaci.\n\nOdesláno: ${timestamp}`,
  alertSubject: chainName => `Upozornění na health factor Aave - ${chainName}`,
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>Váš health factor na Aave ${csOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} je ` +
    `<strong>${healthFactor}</strong>, což je pod vaším prahem ` +
    `<strong>${threshold}</strong>.</p>` +
    `<p>Zvažte doplnění kolaterálu nebo splacení dluhu, abyste se vyhnuli likvidaci.</p>` +
    `<p><small>Vytvořeno: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "kritický", risky: "rizikový", safe: "bezpečný" };
    const now =
      position.kind === "debt"
        ? `Teď: health factor ${position.healthFactor} (${statusWord[position.status]}), kolaterál ${position.collateral}, dluh ${position.debt}.`
        : position.kind === "noDebt"
          ? `Teď: bez dluhu, takže nic nemůže být zlikvidováno${position.collateral ? ` (kolaterál ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Teď: na tomto trhu nemáte otevřenou pozici."
            : "Teď se vaši pozici nepodařilo načíst. Skutečná upozornění to zkoušejí při každé kontrole znovu.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "To je pod vaším prahem, takže příští kontrola pošle skutečné upozornění."
          : "To je nad vaším prahem, takže teď by žádné upozornění neodešlo."
        : null;
    const every = plural("cs", minutes, {
      one: "každou minutu",
      few: `každé ${minutes} minuty`,
      other: `každých ${minutes} minut`,
    });
    return [
      "Testovací zpráva od Tokenpingu: upozornění přes tento kanál fungují.",
      `Vaše upozornění: ${chainName}, když health factor klesne pod ${threshold}.`,
      now,
      ...(verdict ? [verdict] : []),
      `Kontrola ${every}. Odesláno: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Testovací zpráva Tokenpingu - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
      : `${market.loan} s pevnou sazbou, splatnost ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Váš health factor na Morpho ${csOnMarket(chainName, "network")} je ${healthFactor}, což je pod vaším prahem ${threshold}.`,
    `Trh: ${market}.`,
    ...(preLiquidation
      ? [
          "Na tomto trhu jste zapnuli předběžnou likvidaci (pre-liquidation), proto se health factor měří vůči její dřívější hranici: pod 1 může být část vaší pozice prodána.",
        ]
      : []),
    "Zvažte doplnění kolaterálu nebo splacení dluhu, abyste se vyhnuli likvidaci.",
    `Odesláno: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Upozornění na health factor Morpho - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Váš úvěr s pevnou sazbou na Morpho ${csOnMarket(chainName, "network")} dosáhl splatnosti ${when} a stále na něm zbývá dluh ${debt}.`,
          `Trh: ${market}.`,
          "Teď může být kdykoli zlikvidován, bez ohledu na health factor. Splaťte ho, abyste se vyhnuli likvidaci.",
          `Odesláno: ${timestamp}`,
        ]
      : [
          `Váš úvěr s pevnou sazbou na Morpho ${csOnMarket(chainName, "network")} má splatnost do ${stage === "7d" ? "7 dní" : "24 hodin"}, ${when}.`,
          `Trh: ${market}.`,
          `Dluh: ${debt}.`,
          "Po splatnosti může být jakýkoli nesplacený dluh zlikvidován, proto ho splaťte včas.",
          `Odesláno: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Úvěr na Morpho je po splatnosti - ${chainName}`
      : `Splatnost úvěru na Morpho do ${stage === "7d" ? "7 dní" : "24 hodin"} - ${chainName}`,
};
