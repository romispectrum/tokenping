import type { NotificationMessages } from "./shared";
import { plural, ruOnMarket } from "~~/i18n/format";

// Read on a phone: short sentences. The network's or market's name follows "в сети" or "на рынке", or a colon,
// so no name takes a case ending.
const ACT = "Чтобы избежать ликвидации, подумайте о том, чтобы добавить залог или погасить долг.";

/** "каждые 5 минут", "каждые 2 минуты", "каждую минуту". */
const everyMinutes = (minutes: number) =>
  plural("ru", minutes, {
    one: minutes === 1 ? "каждую минуту" : `каждую ${minutes} минуту`,
    few: `каждые ${minutes} минуты`,
    many: `каждые ${minutes} минут`,
    other: `каждые ${minutes} минуты`,
  });

const within = (stage: "7d" | "1d") => (stage === "7d" ? "7 дней" : "24 часов");

export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `Ваш health factor в Aave ${ruOnMarket(chainName)} равен ${healthFactor}, ` +
    `это ниже вашего порога ${threshold}. ` +
    `${ACT}\n\nОтправлено: ${timestamp}`,
  alertSubject: chainName => `Оповещение о health factor в Aave - ${chainName}`,
  // The html footer says "Создано" (created at) where the text says "Отправлено" (sent at).
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>Ваш health factor в Aave ${ruOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} равен ` +
    `<strong>${healthFactor}</strong>, это ниже вашего порога ` +
    `<strong>${threshold}</strong>.</p>` +
    `<p>${ACT}</p>` +
    `<p><small>Создано: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "критический", risky: "рискованный", safe: "безопасный" };
    const now =
      position.kind === "debt"
        ? `Сейчас: health factor ${position.healthFactor} (${statusWord[position.status]}), залог ${position.collateral}, долг ${position.debt}.`
        : position.kind === "noDebt"
          ? `Сейчас: долга нет, поэтому ликвидировать нечего${position.collateral ? ` (залог ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Сейчас: на этом рынке нет открытой позиции."
            : "Сейчас: не удалось прочитать вашу позицию. Настоящие оповещения пробуют снова при каждой проверке.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "Это ниже вашего порога, поэтому следующая проверка отправит настоящее оповещение."
          : "Это выше вашего порога, поэтому сейчас оповещение не было бы отправлено."
        : null;
    return [
      "Тестовое сообщение от Tokenping: оповещения в этом канале работают.",
      `Ваше оповещение: ${chainName}, когда health factor опускается ниже ${threshold}.`,
      now,
      ...(verdict ? [verdict] : []),
      `Проверка ${everyMinutes(minutes)}. Отправлено: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Тестовое сообщение Tokenping - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
      : `${market.loan}, фиксированная ставка, срок погашения ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Ваш health factor в Morpho ${ruOnMarket(chainName, "network")} равен ${healthFactor}, это ниже вашего порога ${threshold}.`,
    `Рынок: ${market}.`,
    ...(preLiquidation
      ? [
          "Вы включили предликвидацию (pre-liquidation) на этом рынке, поэтому health factor измеряется относительно её более ранней границы: ниже 1 часть вашей позиции может быть продана.",
        ]
      : []),
    ACT,
    `Отправлено: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Оповещение о health factor в Morpho - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Срок погашения вашего займа с фиксированной ставкой в Morpho ${ruOnMarket(chainName, "network")} наступил ${when}, а долг ещё составляет ${debt}.`,
          `Рынок: ${market}.`,
          "Теперь его могут ликвидировать в любой момент, каким бы ни был health factor. Погасите его, чтобы избежать ликвидации.",
          `Отправлено: ${timestamp}`,
        ]
      : [
          `Срок погашения вашего займа с фиксированной ставкой в Morpho ${ruOnMarket(chainName, "network")} наступит в течение ${within(stage)}: ${when}.`,
          `Рынок: ${market}.`,
          `Долг: ${debt}.`,
          "После срока погашения непогашенный остаток долга могут ликвидировать, поэтому погасите его до этого момента.",
          `Отправлено: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Срок погашения займа в Morpho прошёл - ${chainName}`
      : `Срок погашения займа в Morpho наступит в течение ${within(stage)} - ${chainName}`,
};
