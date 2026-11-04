import type { MorphoMessages } from "./shared";
import { formatDecimal, plural, ukForMarket, ukOnMarket } from "~~/i18n/format";

/** "у 7 мережах", "у 21 мережі". */
const onNetworks = (count: number) => plural("uk", count, { one: `у ${count} мережі`, other: `у ${count} мережах` });

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

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Сповіщення про health factor у Morpho Blue і Midnight",
    metaDescription: (networkCount, channels) =>
      `Сповіщення про health factor у Morpho Blue і Midnight через ${channels}, ${onNetworks(networkCount)}, і нагадування до строку погашення фіксованої позики.`,
    title: "Позиції в Morpho Blue і Midnight та сповіщення про health factor",
    intro: networks =>
      `Ваші позики на ринках, які показує застосунок Morpho, у цих мережах: ${networks}. Позики зі змінною ставкою (Morpho Blue) і позики з фіксованою ставкою (Morpho Midnight). Health factor зчитується з блокчейну.`,
    checks: minutes =>
      `Сповіщення перевіряються ${everyMinutes(minutes)}. Позика з фіксованою ставкою також отримує нагадування за 7 днів і за 1 день до строку погашення, а після нього сповіщення під час кожної перевірки, поки лишається борг.`,
    access: "Одна оплата доступу покриває ваші сповіщення в Aave і в Morpho.",
    notAffiliated: "Tokenping не пов'язаний з Morpho.",
    guideHealthFactor: "Як працює health factor у Morpho",
    guideLiquidation: "Як працює ліквідація в Morpho",
    guideMidnight: "Позики з фіксованою ставкою в Morpho Midnight",
    aaveDashboard: "Позичаєте в Aave? Відкрити панель Aave",
  },
  positionsHeading: "Ваші позиції в Morpho",
  gate: {
    title: "Підключіть гаманець, щоб продовжити",
    description:
      "Tokenping потрібна адреса вашого гаманця, щоб знайти ваші позиції в Morpho. Підключення не переміщує кошти і не стягує комісію.",
    connect: "Підключити гаманець",
    connecting: "Підключення",
    approveInWallet: "Підтвердьте підключення у своєму гаманці.",
  },
  list: {
    heading: "Ринки",
    count: count => `З боргом: ${count}`,
    none: "На ринках, які показує застосунок Morpho, позик не знайдено.",
    discoveryFailed: "API Morpho не відповів, тому показано лише ринки зі збереженим сповіщенням.",
    variableRate: "Змінна ставка",
    fixedRate: "Фіксована ставка",
    matures: date => `Строк погашення: ${date}`,
    matured: "Строк погашення минув",
    unreadable: "Не вдалося зчитати",
    retry: market => `Ще раз зчитати ринок ${market}`,
    noneSelectedDescription: "Виберіть ринок, щоб побачити свою позицію в Morpho.",
  },
  details: {
    collateralValue: "Вартість застави",
    debt: "Борг",
    ltv: "LTV",
    lltv: "LTV ліквідації",
    maturity: "Строк погашення",
    timeLeft: (days, hours) =>
      days > 0
        ? plural("uk", days, {
            one: `через ${days} день`,
            few: `через ${days} дні`,
            many: `через ${days} днів`,
            other: `через ${days} дня`,
          })
        : plural("uk", hours, {
            one: `через ${hours} годину`,
            few: `через ${hours} години`,
            many: `через ${hours} годин`,
            other: `через ${hours} години`,
          }),
    pastMaturity:
      "Строк погашення цієї позики минув: залишок боргу можуть ліквідувати будь-коли, незалежно від health factor. Погасіть його, щоб уникнути ліквідації.",
    preLiquidation: "Передліквідація",
    preLiquidationNote:
      "Ви ввімкнули передліквідацію на цьому ринку, тож health factor вимірюється відносно її ранішої межі: нижче 1 частину вашої позиції можуть продати.",
    amountsIn: token => `Суми вказано в токені ${token}, за оцінкою оракула ринку.`,
    noDebtTitle: "На цьому ринку немає боргу",
    noDebtDetail: "Збережене сповіщення лишається збереженим і нічого не надсилає, поки немає боргу.",
    unreadableTitle: "Не вдалося зчитати цю позицію",
    unreadableDetail: "Мережа не відповіла. Ваше сповіщення й далі перевіряється.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Оплатіть один раз, щоб налаштувати сповіщення про health factor ${ukOnMarket(marketName, "market")} та на інших ринках. Нічого не поновлюється автоматично: ви платите зі свого гаманця, коли хочете продовжити.`,
    descriptionExtend: marketName =>
      `Ваші збережені налаштування сповіщень ${ukForMarket(marketName, "market")} досі є у вашому акаунті. Оплатіть знову, щоб продовжити доступ і змінити їх.`,
  },
};
