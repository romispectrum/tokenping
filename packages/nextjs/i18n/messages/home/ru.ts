import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal, plural, ruOnMarket } from "~~/i18n/format";
import type { AlertPlan } from "~~/services/marketing/alertPlan";

// The alert price ("3 USDC за 30 дней" or the blog's fallback) always stands where the nominative reads correctly:
// "Цена оповещений: ...", never after "стоит". A network's name follows "в сети", and a channel's name follows "через",
// so neither needs a case ending.

/** "1 день", "2 дня", "30 дней", "21 день". */
const ruDays = (days: number) =>
  plural("ru", days, { one: `${days} день`, few: `${days} дня`, many: `${days} дней`, other: `${days} дня` });

/** "каждые 5 минут", "каждые 2 минуты", "каждую минуту". */
const ruEveryMinutes = (minutes: number) =>
  plural("ru", minutes, {
    one: minutes === 1 ? "каждую минуту" : `каждую ${minutes} минуту`,
    few: `каждые ${minutes} минуты`,
    many: `каждые ${minutes} минут`,
    other: `каждые ${formatDecimal("ru", minutes)} минуты`,
  });

/** "5 минут", "2 минуты", "1 минуту" (after "через"). */
const ruMinutesLater = (minutes: number) =>
  plural("ru", minutes, {
    one: `${minutes} минуту`,
    few: `${minutes} минуты`,
    many: `${minutes} минут`,
    other: `${formatDecimal("ru", minutes)} минуты`,
  });

const ruPrice = (plan: AlertPlan) => `${formatDecimal("ru", plan.priceLabel)} за ${ruDays(plan.days)}`;

/** "в 29 сетях", "в 21 сети". */
const ruOnNetworks = (networks: number) =>
  plural("ru", networks, { one: `в ${networks} сети`, other: `в ${networks} сетях` });

/** "1 сеть", "2 сети", "29 сетей". */
const ruNetworks = (networks: number) =>
  plural("ru", networks, {
    one: `${networks} сеть`,
    few: `${networks} сети`,
    many: `${networks} сетей`,
    other: `${networks} сети`,
  });

/** "1 рынок", "2 рынка", "25 рынков". */
const ruMarkets = (markets: number) =>
  plural("ru", markets, {
    one: `${markets} рынок`,
    few: `${markets} рынка`,
    many: `${markets} рынков`,
    other: `${markets} рынка`,
  });

/** "1 Spoke", "13 Spoke": Aave's term, kept in Latin letters and not declined. */
const ruSpokes = (spokes: number) => `${spokes} Spoke`;

/** "в сети Arbitrum One", or the payment network unnamed. */
const ruOnChain = (chainName: string | undefined) =>
  chainName ? ruOnMarket(chainName, "network") : "в платёжной сети";

export const MESSAGES: HomeMessages = {
  headline: channels => `Оповещения о health factor в Aave и Morpho через ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Оповещения через ${channels}, когда health factor в Aave или Morpho ниже вашего порога, ${ruOnNetworks(networks)}, ${ruEveryMinutes(minutes)}.`
      : `Оповещения через ${channels}, когда ваш health factor в Aave или Morpho опускается ниже порога, ${ruOnNetworks(networks)}. Проверка ${ruEveryMinutes(minutes)}.`,
  channelBadge: capitalize,
  pricingCta: plan => (plan ? `Настроить оповещения: ${ruPrice(plan)}` : "Настроить оповещения"),
  offerDescription: ({ days, currency }) =>
    `Оповещения о health factor на ${ruDays(days)}, оплата в ${currency} из вашего кошелька. Без автопродления.`,

  kicker: "Aave V3 и V4, Morpho Blue и Midnight",
  heroLead: ({ minutes, channels }) =>
    `Проверка ${ruEveryMinutes(minutes)}. Сообщение через ${channels}, пока вы ниже своей границы. Только чтение, без одобрений токенов.`,
  networksLabel: "Сети",
  heroCoverage: networks => ruNetworks(networks),
  channelsLabel: "Оповещения через:",
  exampleAlertLabel: "Что говорится в оповещении",
  exampleAlertCaption: subject => `Пример. Письма приходят с темой «${subject}».`,

  dashboardCta: "Открыть панель Aave",
  morphoDashboardCta: "Открыть панель Morpho",
  dashboardCtaMicrocopy: alertPrice => `Подключите кошелёк и увидите все позиции. Цена оповещений: ${alertPrice}.`,

  problemTitle: "Health factor падает, пока вы спите",
  problemLead:
    "Aave показывает ваш health factor, но не отправляет оповещений (октябрь 2026 г.). За ночь его сдвигают три вещи:",
  problemCauses: [
    { title: "Цены падают", body: "ETH дешевеет, и ваш залог стоит меньше." },
    { title: "Начисляются проценты", body: "Ваш долг растёт каждую секунду." },
    { title: "Пороги меняются", body: "В Aave governance может снизить порог ликвидации." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Заёмщики рассказывают, как ",
      morning("проснулись и увидели ликвидированную позицию"),
      ", как ",
      failedRepays("целый час не проходили транзакции погашения"),
      " и как ",
      polygon("погашение при 1,01 опоздало"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "Ликвидатор вдобавок получает бонус: 5 % на WETH на рынке Ethereum Core (октябрь 2026 г.).",
      guide && rich(" Подробнее: ", guide("как проходит ликвидация"), "."),
    ),
  chart: {
    threshold: "ваш порог",
    liquidation: "ликвидация",
    alertSent: "Оповещение отправлено",
    youCheck: "Вы смотрите в телефон",
    caption:
      "Пример одной ночи. Оповещение уходит в 03:05, при первой проверке ниже 1,5, за пять часов до того, как вы посмотрите.",
  },

  howItWorksTitle: "Как это работает",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` ${ruOnMarket(paymentChain, "network")}` : "";
    return [
      {
        title: "Подключите кошелёк, с которого берёте заём",
        body: "Только чтение. Aave и Morpho, у каждого своя страница.",
      },
      {
        title: plan
          ? `Откройте доступ к оповещениям за ${formatDecimal("ru", plan.priceLabel)}`
          : "Откройте доступ к оповещениям небольшой оплатой в USDC",
        body: `${plan ? `Доступ на ${ruDays(plan.days)}, оплата` : "Оплата"} в USDC${paidOn}. Без автопродления.`,
      },
      {
        title: "Задайте границу для каждого рынка",
        body: `От ${formatDecimal("ru", threshold.min)} (в Morpho от ${formatDecimal("ru", morphoMin)}) до ${formatDecimal("ru", threshold.max)}, по умолчанию ${formatDecimal("ru", threshold.default)}.`,
      },
      {
        title: "Получайте сообщения, пока вы ниже неё",
        body: `${capitalize(ruEveryMinutes(minutes))}, через ${channels}, пока вы не вернётесь выше своей границы.`,
      },
    ];
  },
  scaleTitle: "Где провести границу",
  scale: {
    liquidation: "ликвидация",
    critical: "Критический",
    risky: "Рискованный",
    safe: "Безопасный",
    defaultThreshold: value => `По умолчанию ${value}`,
    below: value => `Ниже ${value}`,
    between: (from, to) => `От ${from} до ${to}`,
    andAbove: value => `${value} и выше`,
    range: (min, max) => `Любое значение от ${min} до ${max}.`,
  },
  scaleGuide: "Как выбрать порог",

  coverageTitle: "Каждый рынок Aave и каждый указанный рынок Morpho",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `Aave V3: ${ruMarkets(v3Markets)} ${ruOnNetworks(v3Networks)}; Aave V4: ${ruSpokes(spokes)} ${ruOnNetworks(v4Networks)}, по состоянию на 4 ноября 2026 г. Кроме того, каждый указанный рынок Morpho ${ruOnNetworks(morphoNetworks)}.`,
  coverage: {
    v3Markets: count => `V3: ${ruMarkets(count)}`,
    v4Spokes: count => `V4: ${ruSpokes(count)}`,
    morpho: "Morpho",
  },
  coverageNote:
    "Рынки в сетях Scroll, ZKsync, Metis, Soneium и Sonic governance Aave постепенно сворачивает, и мы продолжаем их отслеживать. Не охвачены: Aave V3 в сети Harmony, неуказанные рынки Morpho и другие протоколы.",

  pricingTitle: "Цены",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Оповещения", detail: capitalize(alertPrice) },
    { term: "Продление", detail: "Автоматического нет: оплатите снова, когда понадобится ещё время" },
    {
      term: "Оплата",
      detail: paymentChain
        ? `USDC ${ruOnMarket(paymentChain, "network")}, из вашего кошелька (одобрение, затем оплата)`
        : "USDC, из вашего кошелька",
    },
  ],
  priceSource: "Цена читается из платёжного контракта и обновляется раз в час.",
  pricingFootnote: "За просмотр позиций платить не нужно.",

  questionsTitle: "Вопросы, которые стоит задать до подключения кошелька",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = ruOnChain(paymentChain);
    return [
      {
        question: "Может ли Tokenping распоряжаться моими средствами?",
        answer: rich(
          `Нет. Tokenping только читает ваши позиции и никогда не запрашивает одобрение или подпись в Aave или Morpho. Единственные транзакции: оплата ${onChain}, то есть одобрение ровно на сумму цены, затем сам платёж. `,
          links.sourcify
            ? rich(
                "Контракт ",
                links.sourcify("верифицирован в Sourcify"),
                ", а его ",
                links.sourceCode("исходный код открыт"),
              )
            : links.sourceCode("Исходный код контракта открыт"),
          "; кошелёк команды может менять его цену, приостанавливать и обновлять его.",
        ),
      },
      {
        question: "Что вы храните?",
        answer: rich(
          "Адрес вашего кошелька, ваши оповещения и контактные данные, которые вы указали (email, имя пользователя в Signal",
          hasTelegram ? ", чат в Telegram" : "",
          `). Никакой истории и никаких cookie для отслеживания; просмотры страниц считаются анонимно. Эти контактные данные может прочитать только тот, кто может подписывать вашим кошельком, но платежи ${onChain} публичны. Полный список есть на `,
          links.privacy("странице о конфиденциальности"),
          ".",
        ),
      },
      {
        question: "Сколько это стоит?",
        answer: rich(
          `Цена оповещений: ${alertPrice}, в USDC ${onChain}, плюс немного ETH на газ. За просмотр позиций платить не нужно. Без автопродления, без возврата средств.`,
        ),
      },
      {
        question: "Какие займы в Morpho охвачены?",
        answer: rich(
          `Займы в Morpho Blue (переменная ставка) и Morpho Midnight (фиксированная ставка) на рынках, которые указаны в приложении Morpho, с порогами от ${formatDecimal("ru", morphoMin)}. Для займа с фиксированной ставкой также приходят напоминания перед сроком погашения. Их покрывает тот же тариф: откройте `,
          links.morphoDashboard("панель Morpho"),
          ".",
        ),
      },
      {
        question: "Что, если оповещение не придёт?",
        answer: rich(
          `Следующая проверка через ${ruMinutesLater(minutes)} попробует снова. Доставка зависит от Resend, ретранслятора Signal, `,
          hasTelegram ? "Telegram Bot API, " : "",
          "публичных RPC-узлов и планировщика Vercel, без гарантии доступности. Выберите два канала и оставьте себе время на действия.",
        ),
      },
      {
        question: "Как остановить оповещения?",
        answer: rich(
          "Они прекращаются, когда ваш health factor возвращается выше вашей границы или когда вы удаляете оповещение (для этого нужен активный доступ). Доступ истёк? Напишите нам в ",
          links.x("X"),
          " или в нашем сообществе в ",
          links.telegramCommunity("Telegram"),
          " или ",
          links.signalCommunity("Signal"),
          ".",
          hasTelegram ? " В Telegram также работает /stop." : "",
          " Отложить оповещения или отписаться по ссылке пока нельзя.",
        ),
      },
      {
        question: "Можно ли следить за кошельком, который я не подключаю?",
        answer: rich("Пока нет. Один кошелёк, тот, который вы подключили; доступ оформляется на кошелёк."),
      },
      {
        question: "Другие инструменты ничего не стоят. Зачем платить?",
        answer: rich(
          "Если вам подходит бот в Telegram или мобильное приложение, пользуйтесь им",
          links.comparison ? rich(": они описаны в нашем ", links.comparison("сравнении")) : null,
          ". Tokenping нужен для оповещений через Signal или email на каждом рынке Aave и каждом указанном рынке Morpho.",
        ),
      },
    ];
  },

  limitsTitle: "Ограничения без прикрас",
  limits: ({ minutes, paymentChain }) => [
    `Проверка ${ruEveryMinutes(minutes)}, а не непрерывно.`,
    "Каждая проверка ниже вашей границы отправляет новое сообщение: без паузы и без сводок.",
    "Одна граница на рынок, только для подключённого кошелька.",
    `Только USDC${paymentChain ? ` ${ruOnMarket(paymentChain, "network")}` : ""}: без карт, без возврата средств.`,
    "В письмах пока нет ссылки для отписки; для удаления оповещения нужен активный доступ.",
    "Бета-версия: доставка через сторонние сервисы, без гарантии доступности.",
  ],

  blogTitle: "Из блога",
  allGuides: "Все руководства по Aave и Morpho",

  closingTitle: "Настройте оповещение о health factor в Aave или Morpho",
  closingLead: alertPrice => `${capitalize(alertPrice)}, оплата из вашего кошелька. Без автопродления.`,
};
