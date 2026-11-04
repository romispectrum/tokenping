import type { NotificationMessages } from "./shared";
import { formatDecimal, plural, ukOnMarket } from "~~/i18n/format";

// Read on a phone: short sentences. The network's or market's name follows "у мережі" or "на ринку", or a colon, so
// no name takes a case ending.
const ACT = "Щоб уникнути ліквідації, додайте заставу або погасіть частину боргу.";

/** "кожні 5 хвилин", "кожні 2 хвилини", "щохвилини". */
const everyMinutes = (minutes: number) =>
  minutes === 1
    ? "щохвилини"
    : plural("uk", minutes, {
        one: `кожні ${minutes} хвилину`,
        few: `кожні ${minutes} хвилини`,
        many: `кожні ${minutes} хвилин`,
        other: `кожні ${formatDecimal("uk", minutes)} хвилини`,
      });

const within = (stage: "7d" | "1d") => (stage === "7d" ? "7 днів" : "24 години");

export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `Ваш health factor в Aave ${ukOnMarket(chainName)} становить ${healthFactor}, ` +
    `це нижче вашого порогу ${threshold}. ` +
    `${ACT}\n\nНадіслано: ${timestamp}`,
  alertSubject: chainName => `Сповіщення про health factor в Aave - ${chainName}`,
  // The html footer says "Створено" (created at) where the text says "Надіслано" (sent at).
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>Ваш health factor в Aave ${ukOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} становить ` +
    `<strong>${healthFactor}</strong>, це нижче вашого порогу ` +
    `<strong>${threshold}</strong>.</p>` +
    `<p>${ACT}</p>` +
    `<p><small>Створено: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "критично", risky: "ризиковано", safe: "безпечно" };
    const now =
      position.kind === "debt"
        ? `Зараз: health factor ${position.healthFactor} (${statusWord[position.status]}), застава ${position.collateral}, борг ${position.debt}.`
        : position.kind === "noDebt"
          ? `Зараз: боргу немає, тож ліквідувати нічого${position.collateral ? ` (застава ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Зараз: на цьому ринку немає відкритої позиції."
            : "Зараз: не вдалося зчитати вашу позицію. Справжні сповіщення пробують знову під час кожної перевірки.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "Це нижче вашого порогу, тож наступна перевірка надішле справжнє сповіщення."
          : "Це вище вашого порогу, тож зараз сповіщення не надсилалося б."
        : null;
    return [
      "Тестове повідомлення від Tokenping: сповіщення в цьому каналі працюють.",
      `Ваше сповіщення: ${chainName}, коли health factor падає нижче ${threshold}.`,
      now,
      ...(verdict ? [verdict] : []),
      `Перевірка ${everyMinutes(minutes)}. Надіслано: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Тестове повідомлення Tokenping - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
      : `${market.loan}, фіксована ставка, строк погашення ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Ваш health factor у Morpho ${ukOnMarket(chainName, "network")} становить ${healthFactor}, це нижче вашого порогу ${threshold}.`,
    `Ринок: ${market}.`,
    ...(preLiquidation
      ? [
          "Ви ввімкнули передліквідацію (pre-liquidation) на цьому ринку, тож health factor вимірюється відносно її ранішої межі: нижче 1 частину вашої позиції можуть продати.",
        ]
      : []),
    ACT,
    `Надіслано: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Сповіщення про health factor у Morpho - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Строк погашення вашої позики з фіксованою ставкою в Morpho ${ukOnMarket(chainName, "network")} настав ${when}, а борг досі становить ${debt}.`,
          `Ринок: ${market}.`,
          "Тепер її можуть ліквідувати будь-коли, незалежно від health factor. Погасіть її, щоб уникнути ліквідації.",
          `Надіслано: ${timestamp}`,
        ]
      : [
          `Строк погашення вашої позики з фіксованою ставкою в Morpho ${ukOnMarket(chainName, "network")} настає протягом ${within(stage)}: ${when}.`,
          `Ринок: ${market}.`,
          `Борг: ${debt}.`,
          "Після строку погашення непогашений борг можуть ліквідувати, тож погасіть його раніше.",
          `Надіслано: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Строк погашення позики в Morpho минув - ${chainName}`
      : `Строк погашення позики в Morpho настає протягом ${within(stage)} - ${chainName}`,
};
