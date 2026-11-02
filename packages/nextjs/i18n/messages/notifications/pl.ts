import type { NotificationMessages } from "./shared";
import { plOnMarket, plural } from "~~/i18n/format";

export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `Twój współczynnik zdrowia w Aave ${plOnMarket(chainName)} wynosi ${healthFactor}, ` +
    `czyli jest poniżej twojego progu ${threshold}. ` +
    `Rozważ dodanie zabezpieczenia lub spłatę długu, aby uniknąć likwidacji.\n\nWysłano: ${timestamp}`,
  alertSubject: chainName => `Alert o współczynniku zdrowia Aave - ${chainName}`,
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>Twój współczynnik zdrowia w Aave ${plOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} wynosi ` +
    `<strong>${healthFactor}</strong>, czyli jest poniżej twojego progu ` +
    `<strong>${threshold}</strong>.</p>` +
    `<p>Rozważ dodanie zabezpieczenia lub spłatę długu, aby uniknąć likwidacji.</p>` +
    `<p><small>Utworzono: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "krytyczny", risky: "ryzykowny", safe: "bezpieczny" };
    const now =
      position.kind === "debt"
        ? `Teraz: współczynnik zdrowia ${position.healthFactor} (${statusWord[position.status]}), zabezpieczenie ${position.collateral}, dług ${position.debt}.`
        : position.kind === "noDebt"
          ? `Teraz: brak długu, więc nic nie może zostać zlikwidowane${position.collateral ? ` (zabezpieczenie ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Teraz: brak otwartej pozycji na tym rynku."
            : "Teraz: nie udało się odczytać twojej pozycji. Prawdziwe alerty próbują ponownie przy każdym sprawdzeniu.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "To poniżej twojego progu, więc następne sprawdzenie wyśle prawdziwy alert."
          : "To powyżej twojego progu, więc teraz alert nie zostałby wysłany."
        : null;
    const every = plural("pl", minutes, {
      one: "co minutę",
      few: `co ${minutes} minuty`,
      many: `co ${minutes} minut`,
      other: `co ${minutes} minuty`,
    });
    return [
      "Wiadomość testowa od Tokenping: alerty w tym kanale działają.",
      `Twój alert: ${chainName}, gdy współczynnik zdrowia spadnie poniżej ${threshold}.`,
      now,
      ...(verdict ? [verdict] : []),
      `Sprawdzane ${every}. Wysłano: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Wiadomość testowa Tokenping - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
      : `${market.loan} o stałym oprocentowaniu, termin ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Twój współczynnik zdrowia w Morpho ${plOnMarket(chainName, "network")} wynosi ${healthFactor}, czyli jest poniżej twojego progu ${threshold}.`,
    `Rynek: ${market}.`,
    ...(preLiquidation
      ? [
          "Na tym rynku masz włączoną prelikwidację (pre-liquidation), więc współczynnik zdrowia jest liczony względem jej wcześniejszej granicy: poniżej 1 część twojej pozycji może zostać sprzedana.",
        ]
      : []),
    "Rozważ dodanie zabezpieczenia lub spłatę długu, aby uniknąć likwidacji.",
    `Wysłano: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Alert o współczynniku zdrowia Morpho - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Twoja pożyczka o stałym oprocentowaniu w Morpho ${plOnMarket(chainName, "network")} osiągnęła termin zapadalności ${when}, a do spłaty wciąż zostało ${debt}.`,
          `Rynek: ${market}.`,
          "Teraz może zostać zlikwidowana w dowolnej chwili, niezależnie od współczynnika zdrowia. Spłać ją, aby uniknąć likwidacji.",
          `Wysłano: ${timestamp}`,
        ]
      : [
          `Twoja pożyczka o stałym oprocentowaniu w Morpho ${plOnMarket(chainName, "network")} zapada w ciągu ${stage === "7d" ? "7 dni" : "24 godzin"}, termin: ${when}.`,
          `Rynek: ${market}.`,
          `Dług: ${debt}.`,
          "Po terminie zapadalności niespłacony dług może zostać zlikwidowany, więc spłać go wcześniej.",
          `Wysłano: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Pożyczka w Morpho po terminie zapadalności - ${chainName}`
      : `Pożyczka w Morpho zapada w ciągu ${stage === "7d" ? "7 dni" : "24 godzin"} - ${chainName}`,
};
