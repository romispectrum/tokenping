import type { NotificationMessages } from "./shared";
import { hrOnMarket, plural } from "~~/i18n/format";

// Read on a phone: short sentences. The network's or market's name follows "na mreži" or "na tržištu", or a colon,
// so no name takes a case ending.
const ACT = "Da izbjegneš likvidaciju, razmisli o dodavanju kolaterala ili otplati duga.";

/** "svakih 5 minuta", "svake 2 minute", "svake minute". */
const everyMinutes = (minutes: number) =>
  minutes === 1
    ? "svake minute"
    : plural("hr", minutes, {
        one: `svakih ${minutes} minuta`,
        few: `svake ${minutes} minute`,
        other: `svakih ${minutes} minuta`,
      });

const within = (stage: "7d" | "1d") => (stage === "7d" ? "7 dana" : "24 sata");

export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `Tvoj health factor na Aaveu ${hrOnMarket(chainName)} iznosi ${healthFactor}, ` +
    `što je ispod tvog praga od ${threshold}. ` +
    `${ACT}\n\nPoslano: ${timestamp}`,
  alertSubject: chainName => `Upozorenje za health factor na Aaveu - ${chainName}`,
  // The html footer says "Izrađeno" (created at) where the text says "Poslano" (sent at).
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>Tvoj health factor na Aaveu ${hrOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} iznosi ` +
    `<strong>${healthFactor}</strong>, što je ispod tvog praga od ` +
    `<strong>${threshold}</strong>.</p>` +
    `<p>${ACT}</p>` +
    `<p><small>Izrađeno: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "kritično", risky: "rizično", safe: "sigurno" };
    const now =
      position.kind === "debt"
        ? `Trenutačno: health factor ${position.healthFactor} (${statusWord[position.status]}), kolateral ${position.collateral}, dug ${position.debt}.`
        : position.kind === "noDebt"
          ? `Trenutačno: nema duga, pa se ništa ne može likvidirati${position.collateral ? ` (kolateral ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Trenutačno: na ovom tržištu nema otvorene pozicije."
            : "Trenutačno: tvoju poziciju nije bilo moguće očitati. Prava upozorenja pokušavaju ponovno pri svakoj provjeri.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "To je ispod tvog praga, pa sljedeća provjera šalje pravo upozorenje."
          : "To je iznad tvog praga, pa sada ne bi bilo poslano upozorenje."
        : null;
    return [
      "Testna poruka od Tokenpinga: upozorenja na ovom kanalu rade.",
      `Tvoje upozorenje: ${chainName}, kad health factor padne ispod ${threshold}.`,
      now,
      ...(verdict ? [verdict] : []),
      `Provjera ${everyMinutes(minutes)}. Poslano: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Testna poruka Tokenpinga - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
      : `${market.loan} fiksna kamata, dospijeće ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Tvoj health factor na Morphu ${hrOnMarket(chainName, "network")} iznosi ${healthFactor}, što je ispod tvog praga od ${threshold}.`,
    `Tržište: ${market}.`,
    ...(preLiquidation
      ? [
          "Na ovom tržištu uključena je predlikvidacija (pre-liquidation), pa se health factor mjeri prema njezinoj ranijoj granici: ispod 1 dio tvoje pozicije može se prodati.",
        ]
      : []),
    ACT,
    `Poslano: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Upozorenje za health factor na Morphu - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Tvoj zajam s fiksnom kamatom na Morphu ${hrOnMarket(chainName, "network")} dospio je ${when}, a dug je još ${debt}.`,
          `Tržište: ${market}.`,
          "Sada se može likvidirati u bilo kojem trenutku, bez obzira na health factor. Otplati ga da izbjegneš likvidaciju.",
          `Poslano: ${timestamp}`,
        ]
      : [
          `Tvoj zajam s fiksnom kamatom na Morphu ${hrOnMarket(chainName, "network")} dospijeva u roku od ${within(stage)}, ${when}.`,
          `Tržište: ${market}.`,
          `Dug: ${debt}.`,
          "Nakon dospijeća neotplaćeni dug može se likvidirati, pa ga otplati prije toga.",
          `Poslano: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Zajam na Morphu prošao je dospijeće - ${chainName}`
      : `Zajam na Morphu dospijeva u roku od ${within(stage)} - ${chainName}`,
};
