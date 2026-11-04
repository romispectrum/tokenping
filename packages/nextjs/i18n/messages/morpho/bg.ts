import type { MorphoMessages } from "./shared";
import { bgForMarket, bgOnMarket, plural } from "~~/i18n/format";

/** "в 7 мрежи", "в 1 мрежа". */
const onNetworks = (count: number) => plural("bg", count, { one: `в ${count} мрежа`, other: `в ${count} мрежи` });

/** "на всеки 5 минути", "на всяка минута". */
const everyMinutes = (minutes: number) => (minutes === 1 ? "на всяка минута" : `на всеки ${minutes} минути`);

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Известия за health factor в Morpho Blue и Midnight",
    metaDescription: (networkCount, channels) =>
      `Известия за health factor в Morpho Blue и Midnight чрез ${channels}, ${onNetworks(networkCount)}, с напомняния преди падежа на заем с фиксирана лихва.`,
    title: "Позиции в Morpho Blue и Midnight и известия за health factor",
    intro: networks =>
      `Вашите позиции със заеми на пазарите, изброени в приложението Morpho, в мрежите ${networks}: заеми с променлива лихва (Morpho Blue) и заеми с фиксирана лихва (Morpho Midnight). Health factor се чете от блокчейна.`,
    checks: minutes =>
      `Известията се проверяват ${everyMinutes(minutes)}. Заем с фиксирана лихва получава и напомняне 7 дни и 1 ден преди падежа, както и известие при всяка проверка след падежа, докато остава дълг.`,
    access: "Едно плащане за достъп покрива известията ви за Aave и Morpho.",
    notAffiliated: "Tokenping не е свързан с Morpho.",
    guideHealthFactor: "Как работи health factor в Morpho",
    guideLiquidation: "Как протича ликвидацията в Morpho",
    guideMidnight: "Заеми с фиксирана лихва в Morpho Midnight",
    aaveDashboard: "Заемате в Aave? Отворете таблото за Aave",
  },
  positionsHeading: "Вашите позиции в Morpho",
  gate: {
    title: "Свържете портфейл, за да продължите",
    description:
      "Tokenping се нуждае от адреса на портфейла ви, за да намери позициите ви в Morpho. Свързването не мести средства и не струва такса.",
    connect: "Свържете портфейла",
    connecting: "Свързваме",
    approveInWallet: "Одобрете връзката в портфейла си.",
  },
  list: {
    heading: "Пазари",
    count: count => `${count} с дълг`,
    none: "Не са открити заеми на пазарите, изброени в приложението Morpho.",
    discoveryFailed: "API на Morpho не отговори, затова са показани само пазарите със запазено известие.",
    variableRate: "Променлива лихва",
    fixedRate: "Фиксирана лихва",
    matures: date => `Падеж: ${date}`,
    matured: "След падежа",
    unreadable: "Не можа да бъде прочетено",
    retry: market => `Повторно четене на ${market}`,
    noneSelectedDescription: "Изберете пазар, за да видите позицията си в Morpho.",
  },
  details: {
    collateralValue: "Стойност на обезпечението",
    debt: "Дълг",
    ltv: "LTV",
    lltv: "LTV на ликвидация",
    maturity: "Падеж",
    timeLeft: (days, hours) =>
      days > 0
        ? plural("bg", days, { one: "след 1 ден", other: `след ${days} дни` })
        : plural("bg", hours, { one: "след 1 час", other: `след ${hours} часа` }),
    pastMaturity:
      "Падежът на този заем е минал: оставащият дълг може да бъде ликвидиран по всяко време, независимо от health factor. Погасете го, за да избегнете ликвидация.",
    preLiquidation: "Предварителна ликвидация",
    preLiquidationNote:
      "Включили сте предварителна ликвидация на този пазар, затова health factor се измерва спрямо нейната по-ранна граница: под 1 част от позицията ви може да бъде продадена.",
    amountsIn: token => `Сумите са в ${token} и са оценени от оракула на пазара.`,
    noDebtTitle: "Няма дълг на този пазар",
    noDebtDetail: "Запазеното известие остава запазено и не изпраща нищо, докато няма дълг.",
    unreadableTitle: "Тази позиция не можа да бъде прочетена",
    unreadableDetail: "Мрежата не отговори. Известието ви продължава да се проверява.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Платете веднъж, за да зададете известия за health factor ${bgOnMarket(marketName, "market")} и на други пазари. Нищо не се подновява автоматично: плащате от портфейла си, когато искате да удължите достъпа.`,
    descriptionExtend: marketName =>
      `Запазените ви настройки на известията ${bgForMarket(marketName, "market")} все още са в акаунта ви. Платете отново, за да удължите достъпа и да ги редактирате.`,
  },
};
