import type { NotificationMessages } from "./shared";
import { plural, srOnMarket } from "~~/i18n/format";

// Read on a phone: short sentences. The network's or market's name follows "na mreži" or "na tržištu", or a colon,
// so no name takes a case ending.
const ACT = "Da izbegneš likvidaciju, razmisli o dodavanju kolaterala ili otplati duga.";

/** "svakih 5 minuta", "svaka 2 minuta", "svakog minuta" (minut is masculine in Serbian). */
const everyMinutes = (minutes: number) =>
  minutes === 1
    ? "svakog minuta"
    : plural("sr", minutes, {
        one: `svaki ${minutes} minut`,
        few: `svaka ${minutes} minuta`,
        other: `svakih ${minutes} minuta`,
      });

const within = (stage: "7d" | "1d") => (stage === "7d" ? "7 dana" : "24 sata");

export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `Tvoj Aave health factor ${srOnMarket(chainName)} iznosi ${healthFactor}, ` +
    `što je ispod tvog praga od ${threshold}. ` +
    `${ACT}\n\nPoslato: ${timestamp}`,
  alertSubject: chainName => `Aave upozorenje za health factor - ${chainName}`,
  // The html footer says "Napravljeno" (created at) where the text says "Poslato" (sent at).
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>Tvoj Aave health factor ${srOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} iznosi ` +
    `<strong>${healthFactor}</strong>, što je ispod tvog praga od ` +
    `<strong>${threshold}</strong>.</p>` +
    `<p>${ACT}</p>` +
    `<p><small>Napravljeno: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "kritično", risky: "rizično", safe: "bezbedno" };
    const now =
      position.kind === "debt"
        ? `Trenutno: health factor ${position.healthFactor} (${statusWord[position.status]}), kolateral ${position.collateral}, dug ${position.debt}.`
        : position.kind === "noDebt"
          ? `Trenutno: nema duga, pa ništa ne može da bude likvidirano${position.collateral ? ` (kolateral ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Trenutno: na ovom tržištu nema otvorene pozicije."
            : "Trenutno: tvoju poziciju nije bilo moguće očitati. Prava upozorenja pokušavaju ponovo pri svakoj proveri.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "To je ispod tvog praga, pa sledeća provera šalje pravo upozorenje."
          : "To je iznad tvog praga, pa sada upozorenje ne bi bilo poslato."
        : null;
    return [
      "Test poruka od Tokenpinga: upozorenja na ovom kanalu rade.",
      `Tvoje upozorenje: ${chainName}, kad health factor padne ispod ${threshold}.`,
      now,
      ...(verdict ? [verdict] : []),
      `Provera ${everyMinutes(minutes)}. Poslato: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Tokenping test poruka - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
      : `${market.loan} fiksna kamata, dospeće ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Tvoj Morpho health factor ${srOnMarket(chainName, "network")} iznosi ${healthFactor}, što je ispod tvog praga od ${threshold}.`,
    `Tržište: ${market}.`,
    ...(preLiquidation
      ? [
          "Na ovom tržištu si uključio predlikvidaciju (pre-liquidation), pa se health factor meri prema njenoj ranijoj granici: ispod 1 deo tvoje pozicije može da bude prodat.",
        ]
      : []),
    ACT,
    `Poslato: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Morpho upozorenje za health factor - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Tvoj Morpho zajam s fiksnom kamatom ${srOnMarket(chainName, "network")} je dospeo ${when}, a dug je još ${debt}.`,
          `Tržište: ${market}.`,
          "Sada može da bude likvidiran u bilo kom trenutku, bez obzira na health factor. Otplati ga da izbegneš likvidaciju.",
          `Poslato: ${timestamp}`,
        ]
      : [
          `Tvoj Morpho zajam s fiksnom kamatom ${srOnMarket(chainName, "network")} dospeva u roku od ${within(stage)}, ${when}.`,
          `Tržište: ${market}.`,
          `Dug: ${debt}.`,
          "Posle dospeća neotplaćeni dug može da bude likvidiran, pa ga otplati pre toga.",
          `Poslato: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Morpho zajam je prošao dospeće - ${chainName}`
      : `Morpho zajam dospeva u roku od ${within(stage)} - ${chainName}`,
};
