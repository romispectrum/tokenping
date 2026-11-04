import type { NotificationMessages } from "./shared";
import { bgOnMarket } from "~~/i18n/format";

// Read on a phone: short sentences. The network's or market's name follows "в мрежата" or "на пазара", or a colon,
// so it stays in Latin letters.
const ACT = "За да избегнете ликвидация, помислете дали да добавите обезпечение или да погасите дълг.";

/** "на всеки 5 минути", "на всяка минута". */
const everyMinutes = (minutes: number) => (minutes === 1 ? "на всяка минута" : `на всеки ${minutes} минути`);

const within = (stage: "7d" | "1d") => (stage === "7d" ? "7 дни" : "24 часа");

export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `Вашият health factor в Aave ${bgOnMarket(chainName)} е ${healthFactor}, ` +
    `което е под прага ви от ${threshold}. ` +
    `${ACT}\n\nИзпратено: ${timestamp}`,
  alertSubject: chainName => `Известие за health factor в Aave - ${chainName}`,
  // The html footer says "Създадено" (created at) where the text says "Изпратено" (sent at).
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>Вашият health factor в Aave ${bgOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} е ` +
    `<strong>${healthFactor}</strong>, което е под прага ви от ` +
    `<strong>${threshold}</strong>.</p>` +
    `<p>${ACT}</p>` +
    `<p><small>Създадено: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "критичен", risky: "рисков", safe: "безопасен" };
    const now =
      position.kind === "debt"
        ? `В момента: health factor ${position.healthFactor} (${statusWord[position.status]}), обезпечение ${position.collateral}, дълг ${position.debt}.`
        : position.kind === "noDebt"
          ? `В момента: няма дълг, така че нищо не може да бъде ликвидирано${position.collateral ? ` (обезпечение ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "В момента: няма отворена позиция на този пазар."
            : "В момента: позицията ви не можа да бъде прочетена. Истинските известия опитват отново при всяка проверка.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "Това е под прага ви, затова следващата проверка изпраща истинско известие."
          : "Това е над прага ви, затова в момента не би било изпратено известие."
        : null;
    return [
      "Тестово съобщение от Tokenping: известията в този канал работят.",
      `Вашето известие: ${chainName}, когато health factor падне под ${threshold}.`,
      now,
      ...(verdict ? [verdict] : []),
      `Проверка ${everyMinutes(minutes)}. Изпратено: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Тестово съобщение от Tokenping - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
      : `${market.loan} с фиксирана лихва, падеж ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Вашият health factor в Morpho ${bgOnMarket(chainName, "network")} е ${healthFactor}, което е под прага ви от ${threshold}.`,
    `Пазар: ${market}.`,
    ...(preLiquidation
      ? [
          "На този пазар сте включили предварителна ликвидация (pre-liquidation), затова health factor се измерва спрямо нейната по-ранна граница: под 1 част от позицията ви може да бъде продадена.",
        ]
      : []),
    ACT,
    `Изпратено: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Известие за health factor в Morpho - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Вашият заем с фиксирана лихва в Morpho ${bgOnMarket(chainName, "network")} достигна падежа си на ${when} и все още има дълг от ${debt}.`,
          `Пазар: ${market}.`,
          "Вече може да бъде ликвидиран по всяко време, независимо от health factor. Погасете го, за да избегнете ликвидация.",
          `Изпратено: ${timestamp}`,
        ]
      : [
          `Вашият заем с фиксирана лихва в Morpho ${bgOnMarket(chainName, "network")} достига падежа си в рамките на ${within(stage)}, на ${when}.`,
          `Пазар: ${market}.`,
          `Дълг: ${debt}.`,
          "След падежа всеки непогасен дълг може да бъде ликвидиран, затова го погасете преди това.",
          `Изпратено: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Падежът на заема в Morpho е минал - ${chainName}`
      : `Заемът в Morpho достига падежа си в рамките на ${within(stage)} - ${chainName}`,
};
