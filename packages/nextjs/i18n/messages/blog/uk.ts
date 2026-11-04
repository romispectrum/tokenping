import type { BlogMessages } from "./shared";
// The alert price ("3 USDC за 30 днів" or the fallback) stands where the nominative reads: "Вартість сповіщень: ...".
import { formatDecimal, plural } from "~~/i18n/format";

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

/** "у 22 мережах", "у 21 мережі". */
const onNetworks = (networks: number) =>
  plural("uk", networks, { one: `у ${networks} мережі`, other: `у ${networks} мережах` });

/** "за день", "за 30 днів", "за 2 дні", "за 1,5 дня". */
const forDays = (days: number) =>
  days === 1
    ? "за день"
    : plural("uk", days, {
        one: `за ${days} день`,
        few: `за ${days} дні`,
        many: `за ${days} днів`,
        other: `за ${formatDecimal("uk", days)} дня`,
      });

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Головна", blog: "Блог" },
  index: {
    title: "Health factor і ліквідації в Aave і Morpho: посібники",
    description:
      "Посібники про health factor в Aave і Morpho, ліквідації, ціни ліквідації та сповіщення, з прикладами розрахунків і датованими даними з джерелами.",
    kicker: "Посібники з Aave і Morpho",
    lead: "Як працює health factor в Aave і в Morpho, що відбувається під час ліквідації, як розрахувати ціну ліквідації і як отримати попередження, поки до неї ще далеко. Кожне число в цих посібниках має джерело і дату, коли його перевірили.",
    dashboardCta: "Відкрити панель Aave",
    morphoDashboardCta: "Відкрити панель Morpho",
    rss: "Підписатися через RSS",
    startHere: "Почніть звідси",
    allGuides: "Усі посібники",
    empty: {
      title: "Посібників поки немає",
      description:
        "Українські версії посібників готуються. Підпишіться через RSS, щоб отримати їх одразу після публікації.",
      otherLanguage: "Читати посібники англійською",
    },
  },
  post: {
    kicker: "Посібник з Aave V3",
    morphoKicker: "Посібник з Morpho",
    byline: { author: "Команда Tokenping", published: "Опубліковано", updated: "Оновлено" },
    readingTime: minutes => `${minutes} хв читання`,
    readGuide: "Читати посібник",
    related: "Схожі посібники",
  },
  endBox: {
    label: "Про Tokenping",
    title: "Сповіщення про health factor від Tokenping",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tokenping перевіряє ваш health factor в Aave V3 і V4 ${everyMinutes(minutes)} ${onNetworks(networks)} і надсилає вам повідомлення через ${channels}, коли він нижчий за ваш поріг. Вартість сповіщень: ${price}${paymentChain ? `, оплата в мережі ${paymentChain}` : ""}; щоб переглядати позиції, платити не потрібно. Сповіщення дають вам час діяти, але не запобігають ліквідації.`,
    cta: "Відкрити панель",
    morpho: {
      title: "Сповіщення про health factor в Morpho від Tokenping",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping перевіряє ваш health factor в Morpho Blue і Midnight ${everyMinutes(minutes)} ${onNetworks(networks)} і надсилає вам повідомлення через ${channels}, коли він нижчий за ваш поріг, а перед строком погашення позики з фіксованою ставкою надсилає нагадування. Вартість сповіщень: ${price}${paymentChain ? `, оплата в мережі ${paymentChain}` : ""}, той самий план, що й для сповіщень Aave; щоб переглядати позиції, платити не потрібно. Сповіщення дають вам час діяти, але не запобігають ліквідації.`,
      cta: "Відкрити панель Morpho",
    },
  },
  alertPrice: {
    fallback: "невелика плата в USDC (актуальну ціну дивіться на панелі)",
    plan: ({ priceLabel, days }) => `${formatDecimal("uk", priceLabel)} ${forDays(days)}`,
  },
  callout: { info: "Примітка", warning: "Попередження" },
  shortAnswer: "Коротка відповідь",
  scopeNote: {
    text: "Стосується Aave V3.7, перевірено на ринках Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche і Gnosis. Інші ринки та мережі V3 можуть працювати на старіших версіях. Відмінності Aave V4 описано там, де правила відрізняються.",
    morphoText:
      "Стосується ринків Morpho Blue і Morpho Midnight, які показує застосунок Morpho. Кожен ринок має власну заставу, оракул і LLTV, тож перевірте дані свого ринку.",
    figuresAsOf: "Дані станом на",
  },
  table: {
    fallbackLabel: "Таблиця, прокручується горизонтально",
    label: (heading, index) => (index === undefined ? `Таблиця: ${heading}` : `Таблиця ${index}: ${heading}`),
    scrollHint: "Прокрутіть убік, щоб побачити всі стовпці.",
  },
};
