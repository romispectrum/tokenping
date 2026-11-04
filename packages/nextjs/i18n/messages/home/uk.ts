import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal, plural, ukOnMarket } from "~~/i18n/format";
import type { AlertPlan } from "~~/services/marketing/alertPlan";

// The alert price ("3 USDC за 30 днів" or the blog's fallback) always stands where the nominative reads correctly:
// "Вартість сповіщень: ...", never after "коштують". A network's name follows "у мережі", so it needs no case ending.

/** "1 день", "2 дні", "30 днів", "21 день". */
const ukDays = (days: number) =>
  plural("uk", days, {
    one: `${days} день`,
    few: `${days} дні`,
    many: `${days} днів`,
    other: `${formatDecimal("uk", days)} дня`,
  });

/** "кожні 5 хвилин", "кожні 2 хвилини", "щохвилини". */
const ukEveryMinutes = (minutes: number) =>
  minutes === 1
    ? "щохвилини"
    : plural("uk", minutes, {
        one: `кожні ${minutes} хвилину`,
        few: `кожні ${minutes} хвилини`,
        many: `кожні ${minutes} хвилин`,
        other: `кожні ${formatDecimal("uk", minutes)} хвилини`,
      });

/** "5 хвилин", "2 хвилини", "1 хвилину" (before "по тому"). */
const ukMinutesLater = (minutes: number) =>
  plural("uk", minutes, {
    one: `${minutes} хвилину`,
    few: `${minutes} хвилини`,
    many: `${minutes} хвилин`,
    other: `${formatDecimal("uk", minutes)} хвилини`,
  });

/** "за 30 днів", "за день". */
const ukForDays = (days: number) => (days === 1 ? "за день" : `за ${ukDays(days)}`);

const ukPrice = (plan: AlertPlan) => `${formatDecimal("uk", plan.priceLabel)} ${ukForDays(plan.days)}`;

/** "у 29 мережах", "у 21 мережі". */
const ukOnNetworks = (networks: number) =>
  plural("uk", networks, { one: `у ${networks} мережі`, other: `у ${networks} мережах` });

/** "1 мережа", "2 мережі", "29 мереж". */
const ukNetworks = (networks: number) =>
  plural("uk", networks, {
    one: `${networks} мережа`,
    few: `${networks} мережі`,
    many: `${networks} мереж`,
    other: `${networks} мережі`,
  });

/** "1 ринок", "2 ринки", "24 ринки", "25 ринків". */
const ukMarkets = (markets: number) =>
  plural("uk", markets, {
    one: `${markets} ринок`,
    few: `${markets} ринки`,
    many: `${markets} ринків`,
    other: `${markets} ринку`,
  });

/** "1 Spoke", "13 Spoke": the English name, which takes no ending. */
const ukSpokes = (spokes: number) => `${spokes} Spoke`;

/** "у мережі Arbitrum One", or the payment network unnamed. */
const ukOnChain = (chainName: string | undefined) =>
  chainName ? ukOnMarket(chainName, "network") : "у мережі для оплати";

export const MESSAGES: HomeMessages = {
  headline: channels => `Сповіщення про health factor в Aave і Morpho через ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Сповіщення через ${channels}, коли health factor в Aave або Morpho нижчий за ваш поріг, ${ukOnNetworks(networks)}, ${ukEveryMinutes(minutes)}.`
      : `Сповіщення через ${channels}, коли ваш health factor в Aave або Morpho падає нижче вашого порогу, ${ukOnNetworks(networks)}. Перевірка ${ukEveryMinutes(minutes)}.`,
  channelBadge: capitalize,
  pricingCta: plan => (plan ? `Налаштувати сповіщення: ${ukPrice(plan)}` : "Налаштувати сповіщення"),
  offerDescription: ({ days, currency }) =>
    `Сповіщення про health factor на ${ukDays(days)}, оплата в ${currency} з вашого гаманця. Без автоматичного поновлення.`,

  kicker: "Aave V3 і V4, Morpho Blue і Midnight",
  heroLead: ({ minutes, channels }) =>
    `Перевірка ${ukEveryMinutes(minutes)}. Повідомлення через ${channels}, поки ви нижче своєї межі. Лише читання, без дозволів на токени.`,
  networksLabel: "Мережі",
  heroCoverage: networks => ukNetworks(networks),
  channelsLabel: "Сповіщення через:",
  exampleAlertLabel: "Що пише сповіщення",
  exampleAlertCaption: subject => `Приклад. Листи надходять з темою «${subject}».`,

  dashboardCta: "Відкрити панель Aave",
  morphoDashboardCta: "Відкрити панель Morpho",
  dashboardCtaMicrocopy: alertPrice => `Підключіть гаманець і побачите всі позиції. Вартість сповіщень: ${alertPrice}.`,

  problemTitle: "Health factor падає, поки ви спите",
  problemLead:
    "Aave показує ваш health factor (фактор здоров'я), але не надсилає сповіщень (жовтень 2026 р.). За ніч його змінюють три речі:",
  problemCauses: [
    { title: "Ціни падають", body: "ETH дешевшає, і ваша застава коштує менше." },
    { title: "Нараховуються відсотки", body: "Ваш борг зростає щосекунди." },
    { title: "Пороги змінюються", body: "В Aave governance може знизити поріг ліквідації." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Позичальники описують, як ",
      morning("прокинулися з ліквідованою позицією"),
      ", ",
      failedRepays("годину невдалих транзакцій погашення"),
      " і ",
      polygon("погашення при 1,01, яке запізнилося"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "Ліквідатор ще й забирає бонус: 5 % на WETH на ринку Ethereum Core (жовтень 2026 р.).",
      guide && rich(" Дивіться, ", guide("як працює ліквідація"), "."),
    ),
  chart: {
    threshold: "ваш поріг",
    liquidation: "ліквідація",
    alertSent: "Сповіщення надіслано",
    youCheck: "Ви дивитеся в телефон",
    caption:
      "Приклад однієї ночі. Сповіщення надходить о 03:05, під час першої перевірки нижче 1,5, за п'ять годин до того, як ви подивитеся.",
  },

  howItWorksTitle: "Як це працює",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` ${ukOnMarket(paymentChain, "network")}` : "";
    return [
      {
        title: "Підключіть гаманець, з якого ви позичаєте",
        body: "Лише читання. Aave і Morpho, кожен на своїй сторінці.",
      },
      {
        title: plan
          ? `Відкрийте сповіщення за ${formatDecimal("uk", plan.priceLabel)}`
          : "Відкрийте сповіщення невеликою оплатою в USDC",
        body: `${plan ? `Доступ на ${ukDays(plan.days)}, оплата` : "Оплата"} в USDC${paidOn}. Без автоматичного поновлення.`,
      },
      {
        title: "Виберіть межу для кожного ринку",
        body: `Від ${formatDecimal("uk", threshold.min)} (у Morpho від ${formatDecimal("uk", morphoMin)}) до ${formatDecimal("uk", threshold.max)}, за замовчуванням ${formatDecimal("uk", threshold.default)}.`,
      },
      {
        title: "Отримуйте повідомлення, поки ви нижче неї",
        body: `${capitalize(ukEveryMinutes(minutes))}, через ${channels}, доки ви не повернетеся вище своєї межі.`,
      },
    ];
  },
  scaleTitle: "Де поставити межу",
  scale: {
    liquidation: "ліквідація",
    critical: "Критично",
    risky: "Ризиковано",
    safe: "Безпечно",
    defaultThreshold: value => `За замовчуванням ${value}`,
    below: value => `Нижче ${value}`,
    between: (from, to) => `Від ${from} до ${to}`,
    andAbove: value => `${value} і вище`,
    range: (min, max) => `Будь-яке значення від ${min} до ${max}.`,
  },
  scaleGuide: "Як вибрати поріг",

  coverageTitle: "Кожен ринок Aave і кожен ринок Morpho з переліку",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `Aave V3: ${ukMarkets(v3Markets)} ${ukOnNetworks(v3Networks)}; Aave V4: ${ukSpokes(spokes)} ${ukOnNetworks(v4Networks)}, станом на 4 листопада 2026 р. А також кожен ринок Morpho з переліку ${ukOnNetworks(morphoNetworks)}.`,
  coverage: {
    v3Markets: count => `V3: ${ukMarkets(count)}`,
    v4Spokes: count => `V4: ${ukSpokes(count)}`,
    morpho: "Morpho",
  },
  coverageNote:
    "Ринки в мережах Scroll, ZKsync, Metis, Soneium і Sonic governance Aave поступово закриває, а ми досі їх відстежуємо. Не охоплено: Aave V3 у мережі Harmony, ринки Morpho поза переліком та інші протоколи.",

  pricingTitle: "Ціни",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Сповіщення", detail: capitalize(alertPrice) },
    { term: "Поновлення", detail: "Нічого не поновлюється автоматично: платіть знову, коли хочете більше часу" },
    {
      term: "Оплата",
      detail: paymentChain
        ? `USDC ${ukOnMarket(paymentChain, "network")}, з вашого гаманця (дозвіл, потім оплата)`
        : "USDC, з вашого гаманця",
    },
  ],
  priceSource: "Ціну зчитують із платіжного контракту й оновлюють щогодини.",
  pricingFootnote: "Щоб переглядати позиції, платити не потрібно.",

  questionsTitle: "Запитання, які варто поставити, перш ніж підключати гаманець",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = ukOnChain(paymentChain);
    return [
      {
        question: "Чи може Tokenping розпоряджатися моїми коштами?",
        answer: rich(
          `Ні. Tokenping лише зчитує ваші позиції і ніколи не просить дозволу чи підпису в Aave або Morpho. Єдині транзакції пов'язані з оплатою ${onChain}: дозвіл рівно на суму ціни, потім сама оплата. `,
          links.sourcify
            ? rich(
                "Контракт ",
                links.sourcify("верифіковано на Sourcify"),
                ", і його ",
                links.sourceCode("вихідний код публічний"),
              )
            : links.sourceCode("Вихідний код контракту публічний"),
          "; гаманець команди може змінювати його ціну, призупиняти його та оновлювати.",
        ),
      },
      {
        question: "Що ви зберігаєте?",
        answer: rich(
          "Адресу вашого гаманця, ваші сповіщення і контактні дані, які ви надаєте (email, ім'я користувача Signal",
          hasTelegram ? ", чат у Telegram" : "",
          `). Ні історії, ні cookie для відстеження; перегляди сторінок рахуються анонімно. Ці контактні дані може прочитати лише той, хто може підписувати вашим гаманцем, але оплати ${onChain} публічні. Повний перелік є на `,
          links.privacy("сторінці про конфіденційність"),
          ".",
        ),
      },
      {
        question: "Скільки це коштує?",
        answer: rich(
          `Вартість сповіщень: ${alertPrice}, в USDC ${onChain}, плюс трохи ETH на gas. Щоб переглядати позиції, платити не потрібно. Без автоматичного поновлення, без повернення коштів.`,
        ),
      },
      {
        question: "Які позики в Morpho охоплено?",
        answer: rich(
          `Позики в Morpho Blue (змінна ставка) і Morpho Midnight (фіксована ставка) на ринках, які показує застосунок Morpho, з порогами від ${formatDecimal("uk", morphoMin)}. Позика з фіксованою ставкою також отримує нагадування перед строком погашення. Їх покриває той самий план: відкрийте `,
          links.morphoDashboard("панель Morpho"),
          ".",
        ),
      },
      {
        question: "Що, як сповіщення не надійде?",
        answer: rich(
          `Наступна перевірка, через ${ukMinutesLater(minutes)}, спробує знову. Доставка залежить від Resend, ретранслятора Signal, `,
          hasTelegram ? "Telegram Bot API, " : "",
          "публічних RPC-вузлів і планувальника Vercel, без гарантії доступності. Виберіть два канали і залиште собі час діяти.",
        ),
      },
      {
        question: "Як зупинити сповіщення?",
        answer: rich(
          "Вони припиняються, щойно ваш health factor повертається вище вашої межі, або коли ви видаляєте сповіщення (потрібен активний доступ). Доступ закінчився? Напишіть нам у ",
          links.x("X"),
          " або в нашій спільноті в ",
          links.telegramCommunity("Telegram"),
          " чи ",
          links.signalCommunity("Signal"),
          ".",
          hasTelegram ? " У Telegram також працює /stop." : "",
          " Відкладення сповіщень і посилання для відписки поки немає.",
        ),
      },
      {
        question: "Чи можна стежити за гаманцем, який я не підключаю?",
        answer: rich("Поки що ні. Один гаманець, той, який ви підключаєте; доступ діє для кожного гаманця окремо."),
      },
      {
        question: "Інші інструменти нічого не коштують. Навіщо платити?",
        answer: rich(
          "Якщо вам підходить Telegram-бот чи мобільний застосунок, користуйтеся ним",
          links.comparison ? rich(": їх описує ", links.comparison("наше порівняння")) : null,
          ". Tokenping створено для сповіщень через Signal або email, на кожному ринку Aave і кожному ринку Morpho з переліку.",
        ),
      },
    ];
  },

  limitsTitle: "Обмеження без прикрас",
  limits: ({ minutes, paymentChain }) => [
    `Перевірка ${ukEveryMinutes(minutes)}, а не безперервно.`,
    "Кожна перевірка нижче вашої межі надсилає нове повідомлення: без відкладення і без зведень.",
    "Одна межа на ринок, лише для підключеного гаманця.",
    `Лише USDC${paymentChain ? ` ${ukOnMarket(paymentChain, "network")}` : ""}: без карток, без повернення коштів.`,
    "У листах поки немає посилання для відписки; видалення сповіщення потребує активного доступу.",
    "Бета-версія: доставка через сторонні сервіси, без гарантії доступності.",
  ],

  blogTitle: "З блогу",
  allGuides: "Усі посібники з Aave і Morpho",

  closingTitle: "Налаштуйте сповіщення про health factor в Aave або Morpho",
  closingLead: alertPrice => `${capitalize(alertPrice)}, оплата з вашого гаманця. Без автоматичного поновлення.`,
};
