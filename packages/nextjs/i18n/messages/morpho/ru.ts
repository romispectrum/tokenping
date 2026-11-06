import type { MorphoMessages } from "./shared";
import { plural, ruForMarket, ruOnMarket } from "~~/i18n/format";

/** "в 7 сетях", "в 1 сети". */
const onNetworks = (count: number) => plural("ru", count, { one: `в ${count} сети`, other: `в ${count} сетях` });

/** "каждые 5 минут", "каждые 2 минуты", "каждую минуту". */
const everyMinutes = (minutes: number) =>
  plural("ru", minutes, {
    one: minutes === 1 ? "каждую минуту" : `каждую ${minutes} минуту`,
    few: `каждые ${minutes} минуты`,
    many: `каждые ${minutes} минут`,
    other: `каждые ${minutes} минуты`,
  });

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Оповещения о health factor в Morpho Blue и Midnight",
    metaDescription: (networkCount, channels) =>
      `Оповещения о health factor в Morpho Blue и Midnight через ${channels}, ${onNetworks(networkCount)}. Напоминания о сроке погашения займов Midnight.`,
    title: "Позиции в Morpho Blue и Midnight и оповещения о health factor",
    intro: networks =>
      `Ваши заёмные позиции на рынках, которые указаны в приложении Morpho, в сетях ${networks}: займы с переменной ставкой (Morpho Blue) и займы с фиксированной ставкой (Morpho Midnight). Health factor читается из блокчейна.`,
    checks: (minutes, repeatMinutes) =>
      `Оповещения проверяются ${everyMinutes(minutes)}. Для займа с фиксированной ставкой также приходит напоминание за 7 дней и за 1 день до срока погашения, а после срока погашения оповещение каждые ${repeatMinutes} минут, пока остаётся долг.`,
    access: "Одна оплата доступа покрывает ваши оповещения в Aave и в Morpho.",
    notAffiliated: "Tokenping не связан с Morpho.",
    guideHealthFactor: "Как работает health factor в Morpho",
    guideLiquidation: "Как проходит ликвидация в Morpho",
    guideMidnight: "Займы с фиксированной ставкой в Morpho Midnight",
    aaveDashboard: "Берёте заём в Aave? Открыть панель Aave",
  },
  positionsHeading: "Ваши позиции в Morpho",
  gate: {
    title: "Подключите кошелёк, чтобы продолжить",
    description:
      "Tokenping нужен адрес вашего кошелька, чтобы найти ваши позиции в Morpho. Подключение не перемещает средства и не стоит комиссии.",
    connect: "Подключить кошелёк",
    connecting: "Подключаем",
    approveInWallet: "Подтвердите подключение в своём кошельке.",
  },
  list: {
    heading: "Рынки",
    count: count => `${count} с долгом`,
    none: "На рынках, которые указаны в приложении Morpho, займов не найдено.",
    discoveryFailed: "API Morpho не ответил, поэтому показаны только рынки с сохранённым оповещением.",
    variableRate: "Переменная ставка",
    fixedRate: "Фиксированная ставка",
    matures: date => `Срок погашения: ${date}`,
    matured: "Срок погашения прошёл",
    unreadable: "Не удалось прочитать",
    retry: market => `Прочитать рынок ${market} ещё раз`,
    noneSelectedDescription: "Выберите рынок, чтобы увидеть свою позицию в Morpho.",
  },
  details: {
    collateralValue: "Стоимость залога",
    debt: "Долг",
    ltv: "LTV",
    lltv: "Ликвидационный LTV",
    maturity: "Срок погашения",
    timeLeft: (days, hours) =>
      days > 0
        ? plural("ru", days, {
            one: `через ${days} день`,
            few: `через ${days} дня`,
            many: `через ${days} дней`,
            other: `через ${days} дня`,
          })
        : plural("ru", hours, {
            one: `через ${hours} час`,
            few: `через ${hours} часа`,
            many: `через ${hours} часов`,
            other: `через ${hours} часа`,
          }),
    pastMaturity:
      "Срок погашения этого займа прошёл: оставшийся долг могут ликвидировать в любой момент, каким бы ни был health factor. Погасите его, чтобы избежать ликвидации.",
    preLiquidation: "Предликвидация",
    preLiquidationNote:
      "Вы включили предликвидацию на этом рынке, поэтому health factor измеряется относительно её более ранней границы: ниже 1 часть вашей позиции может быть продана.",
    amountsIn: token => `Суммы указаны в токене ${token} и оценены по оракулу рынка.`,
    noDebtTitle: "На этом рынке нет долга",
    noDebtDetail: "Сохранённое оповещение остаётся сохранённым и ничего не отправляет, пока долга нет.",
    unreadableTitle: "Не удалось прочитать эту позицию",
    unreadableDetail: "Сеть не ответила. Ваше оповещение по-прежнему проверяется.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Оплатите один раз, чтобы настроить оповещения о health factor ${ruOnMarket(marketName, "market")} и на других рынках. Ничего не продлевается автоматически: вы платите из своего кошелька, когда хотите продлить доступ.`,
    descriptionExtend: marketName =>
      `Ваши сохранённые настройки оповещений ${ruForMarket(marketName, "market")} по-прежнему в вашем аккаунте. Оплатите ещё раз, чтобы продлить доступ и изменить их.`,
  },
};
