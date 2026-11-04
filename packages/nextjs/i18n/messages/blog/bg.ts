import type { BlogMessages } from "./shared";
// The alert price ("3 USDC за 30 дни" or the fallback) stands where the nominative reads: "Цена на известията: ...".
import { formatDecimal, plural } from "~~/i18n/format";

/** "на всеки 5 минути", "на всяка минута". */
const everyMinutes = (minutes: number) =>
  minutes === 1 ? "на всяка минута" : `на всеки ${formatDecimal("bg", minutes)} минути`;

/** "в 22 мрежи", "в 1 мрежа". */
const onNetworks = (networks: number) =>
  plural("bg", networks, { one: `в ${networks} мрежа`, other: `в ${networks} мрежи` });

/** "на ден", "за 30 дни", "за 1,5 дни". */
const forDays = (days: number) => (days === 1 ? "на ден" : `за ${formatDecimal("bg", days)} дни`);

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Начало", blog: "Блог" },
  index: {
    title: "Ръководства за health factor и ликвидации в Aave и Morpho",
    description:
      "Ръководства за health factor в Aave и Morpho, ликвидациите, цените на ликвидация и известията, с примерни изчисления и данни с източници и дати.",
    kicker: "Ръководства за Aave и Morpho",
    lead: "Как работи health factor в Aave и в Morpho, какво се случва при ликвидация, как да изчислите цената си на ликвидация и как да получите предупреждение, преди цената да се доближи до нея. Всяко число в тези ръководства посочва своя източник и датата, на която е проверено.",
    dashboardCta: "Отваряне на таблото за Aave",
    morphoDashboardCta: "Отваряне на таблото за Morpho",
    rss: "Абонирайте се чрез RSS",
    startHere: "Започнете оттук",
    allGuides: "Всички ръководства",
    empty: {
      title: "Все още няма ръководства",
      description:
        "Подготвяме българските версии на ръководствата. Абонирайте се чрез RSS, за да ги получите веднага след публикуването.",
      otherLanguage: "Четете ръководствата на английски",
    },
  },
  post: {
    kicker: "Ръководство за Aave V3",
    morphoKicker: "Ръководство за Morpho",
    byline: { author: "Екипът на Tokenping", published: "Публикувано", updated: "Обновено" },
    readingTime: minutes => `${minutes} мин. четене`,
    readGuide: "Прочетете ръководството",
    related: "Свързани ръководства",
  },
  endBox: {
    label: "За Tokenping",
    title: "Известия за health factor от Tokenping",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tokenping проверява вашия health factor в Aave V3 и V4 ${everyMinutes(minutes)} ${onNetworks(networks)} и ви изпраща съобщение чрез ${channels}, когато той е под вашия праг. Цена на известията: ${price}${paymentChain ? `, плащане в мрежата ${paymentChain}` : ""}; разглеждането на позициите ви не изисква плащане. Известията ви дават време да реагирате, но не предотвратяват ликвидацията.`,
    cta: "Отваряне на таблото",
    morpho: {
      title: "Известия за health factor в Morpho от Tokenping",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping проверява вашия health factor в Morpho Blue и Midnight ${everyMinutes(minutes)} ${onNetworks(networks)} и ви изпраща съобщение чрез ${channels}, когато той е под вашия праг, а преди падежа на заем с фиксирана лихва ви изпраща напомняния. Цена на известията: ${price}${paymentChain ? `, плащане в мрежата ${paymentChain}` : ""}, същият план като известията за Aave; разглеждането на позициите ви не изисква плащане. Известията ви дават време да реагирате, но не предотвратяват ликвидацията.`,
      cta: "Отваряне на таблото за Morpho",
    },
  },
  alertPrice: {
    fallback: "малка такса в USDC (актуалната цена е в таблото)",
    plan: ({ priceLabel, days }) => `${formatDecimal("bg", priceLabel)} ${forDays(days)}`,
  },
  callout: { info: "Забележка", warning: "Внимание" },
  shortAnswer: "Кратък отговор",
  scopeNote: {
    text: "Отнася се за Aave V3.7, проверено на пазарите Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche и Gnosis. Други пазари и мрежи на V3 може да използват по-стари версии. Разликите в Aave V4 са отбелязани там, където правилата се различават.",
    morphoText:
      "Отнася се за пазарите на Morpho Blue и Morpho Midnight, показани в приложението Morpho. Всеки пазар задава свое обезпечение, оракул и LLTV, затова проверете данните на своя пазар.",
    figuresAsOf: "Данни към",
  },
  table: {
    fallbackLabel: "Таблица, превърта се хоризонтално",
    label: (heading, index) => (index === undefined ? `Таблица: ${heading}` : `Таблица ${index}: ${heading}`),
    scrollHint: "Превъртете настрани, за да видите всички колони.",
  },
};
