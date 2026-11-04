import type { BlogMessages } from "./shared";
// The alert price ("3 USDC за 30 дней" or the fallback) stands after a colon, where the nominative reads: "Цена оповещений: ...".
import { formatDecimal, plural } from "~~/i18n/format";

/** "каждые 5 минут", "каждые 2 минуты", "каждую минуту". */
const everyMinutes = (minutes: number) =>
  plural("ru", minutes, {
    one: minutes === 1 ? "каждую минуту" : `каждую ${minutes} минуту`,
    few: `каждые ${minutes} минуты`,
    many: `каждые ${minutes} минут`,
    other: `каждые ${formatDecimal("ru", minutes)} минуты`,
  });

/** "в 22 сетях", "в 21 сети". */
const onNetworks = (networks: number) =>
  plural("ru", networks, { one: `в ${networks} сети`, other: `в ${networks} сетях` });

/** "в день", "за 30 дней", "за 2 дня", "за 1,5 дня". */
const forDays = (days: number) =>
  days === 1
    ? "в день"
    : plural("ru", days, {
        one: `за ${days} день`,
        few: `за ${days} дня`,
        many: `за ${days} дней`,
        other: `за ${formatDecimal("ru", days)} дня`,
      });

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Главная", blog: "Блог" },
  index: {
    title: "Health factor и ликвидации в Aave и Morpho: руководства",
    description:
      "Руководства по health factor в Aave и Morpho, ликвидациям, ценам ликвидации и оповещениям, с разобранными примерами и датированными данными из источников.",
    kicker: "Руководства по Aave и Morpho",
    lead: "Как работает health factor в Aave и в Morpho, что происходит при ликвидации, как рассчитать цену ликвидации и как получить предупреждение заранее, пока до неё ещё далеко. У каждой цифры в этих руководствах указаны источник и дата проверки.",
    dashboardCta: "Открыть панель Aave",
    morphoDashboardCta: "Открыть панель Morpho",
    rss: "Подписаться через RSS",
    startHere: "С чего начать",
    allGuides: "Все руководства",
    empty: {
      title: "Руководств пока нет",
      description: "Руководства на русском готовятся. Подпишитесь через RSS, чтобы получить их сразу после публикации.",
      otherLanguage: "Читать руководства на английском",
    },
  },
  post: {
    kicker: "Руководство по Aave V3",
    morphoKicker: "Руководство по Morpho",
    byline: { author: "Команда Tokenping", published: "Опубликовано", updated: "Обновлено" },
    readingTime: minutes => `${minutes} мин чтения`,
    readGuide: "Читать руководство",
    related: "Похожие руководства",
  },
  endBox: {
    label: "О Tokenping",
    title: "Оповещения о health factor от Tokenping",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tokenping проверяет ваш health factor в Aave V3 и V4 ${everyMinutes(minutes)} ${onNetworks(networks)} и присылает сообщение через ${channels}, когда он ниже вашего порога. Цена оповещений: ${price}${paymentChain ? `, оплата в сети ${paymentChain}` : ""}; за просмотр позиций платить не нужно. Оповещения дают время действовать, но не предотвращают ликвидацию.`,
    cta: "Открыть панель",
    morpho: {
      title: "Оповещения о health factor в Morpho от Tokenping",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping проверяет ваш health factor в Morpho Blue и Midnight ${everyMinutes(minutes)} ${onNetworks(networks)} и присылает сообщение через ${channels}, когда он ниже вашего порога, а перед сроком погашения займа с фиксированной ставкой присылает напоминание. Цена оповещений: ${price}${paymentChain ? `, оплата в сети ${paymentChain}` : ""}, тот же тариф, что и для оповещений Aave; за просмотр позиций платить не нужно. Оповещения дают время действовать, но не предотвращают ликвидацию.`,
      cta: "Открыть панель Morpho",
    },
  },
  alertPrice: {
    fallback: "небольшая плата в USDC (текущая цена указана на панели)",
    plan: ({ priceLabel, days }) => `${formatDecimal("ru", priceLabel)} ${forDays(days)}`,
  },
  callout: { info: "Примечание", warning: "Внимание" },
  shortAnswer: "Коротко",
  scopeNote: {
    text: "Относится к Aave V3.7, проверено на рынках Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche и Gnosis. Другие рынки и сети V3 могут работать на более старых версиях. Отличия Aave V4 отмечены там, где правила различаются.",
    morphoText:
      "Относится к рынкам Morpho Blue и Morpho Midnight, перечисленным в приложении Morpho. Каждый рынок задаёт свой залог, оракул и LLTV, поэтому проверяйте данные своего рынка.",
    figuresAsOf: "Данные на",
  },
  table: {
    fallbackLabel: "Таблица, прокручивается по горизонтали",
    label: (heading, index) => (index === undefined ? `Таблица: ${heading}` : `Таблица ${index}: ${heading}`),
    scrollHint: "Прокрутите вбок, чтобы увидеть все столбцы.",
  },
};
