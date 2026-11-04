import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal, plural } from "~~/i18n/format";
import type { AlertPlan } from "~~/services/marketing/alertPlan";

// The alert price ("3 USDC за 30 дни" or the blog's fallback) always stands where the nominative reads correctly:
// "Цена на известията: ...", never after "струват".

/** "1 ден", "30 дни". */
const bgDays = (days: number) => plural("bg", days, { one: `${days} ден`, other: `${days} дни` });

/** "за 30 дни", "за 1 ден". */
const bgForDays = (days: number) => `за ${bgDays(days)}`;

/** "на всеки 5 минути", "на всяка минута". */
const bgEveryMinutes = (minutes: number) =>
  minutes === 1 ? "на всяка минута" : `на всеки ${formatDecimal("bg", minutes)} минути`;

const bgPrice = (plan: AlertPlan) => `${formatDecimal("bg", plan.priceLabel)} ${bgForDays(plan.days)}`;

/** "в 21 мрежи", "в 1 мрежа". */
const bgOnNetworks = (networks: number) =>
  plural("bg", networks, { one: `в ${networks} мрежа`, other: `в ${networks} мрежи` });

/** "1 мрежа", "22 мрежи". */
const bgNetworks = (networks: number) =>
  plural("bg", networks, { one: `${networks} мрежа`, other: `${networks} мрежи` });

/** "1 пазар", "24 пазара" (the counting form after a number). */
const bgMarkets = (markets: number) => plural("bg", markets, { one: `${markets} пазар`, other: `${markets} пазара` });

/** "1 Spoke", "13 Spoke": the Latin name stays undeclined. */
const bgSpokes = (spokes: number) => `${spokes} Spoke`;

/** "в мрежата Arbitrum One", or the payment network unnamed. */
const bgOnChain = (chainName: string | undefined) => (chainName ? `в мрежата ${chainName}` : "в мрежата за плащане");

export const MESSAGES: HomeMessages = {
  headline: channels => `Известия за health factor в Aave и Morpho чрез ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Известия чрез ${channels}, когато health factor в Aave или Morpho е под прага ви, ${bgOnNetworks(networks)}, ${bgEveryMinutes(minutes)}.`
      : `Известия чрез ${channels}, когато вашият health factor в Aave или Morpho падне под прага ви, ${bgOnNetworks(networks)}. Проверка ${bgEveryMinutes(minutes)}.`,
  channelBadge: capitalize,
  pricingCta: plan => (plan ? `Задайте известия: ${bgPrice(plan)}` : "Задайте известия"),
  offerDescription: ({ days, currency }) =>
    `Известия за health factor ${bgForDays(days)}, платени в ${currency} от портфейла ви. Без автоматично подновяване.`,

  kicker: "Aave V3 и V4, Morpho Blue и Midnight",
  heroLead: ({ minutes, channels }) =>
    `Проверка ${bgEveryMinutes(minutes)}. Съобщение чрез ${channels}, докато сте под границата си. Само за четене, без одобрения.`,
  networksLabel: "Мрежи",
  heroCoverage: networks => bgNetworks(networks),
  channelsLabel: "Известия чрез:",
  exampleAlertLabel: "Как изглежда известието",
  exampleAlertCaption: subject => `Пример. Имейлите пристигат с тема „${subject}“.`,

  dashboardCta: "Отваряне на таблото за Aave",
  morphoDashboardCta: "Отваряне на таблото за Morpho",
  dashboardCtaMicrocopy: alertPrice => `Свържете портфейл и вижте всяка позиция. Цена на известията: ${alertPrice}.`,

  problemTitle: "Health factor пада, докато спите",
  problemLead:
    "Aave показва вашия health factor, но не изпраща известия (октомври 2026 г.). През нощта го движат три неща:",
  problemCauses: [
    { title: "Цените падат", body: "ETH поевтинява и обезпечението ви струва по-малко." },
    { title: "Лихвата се натрупва", body: "Дългът ви расте всяка секунда." },
    { title: "Праговете се променят", body: "В Aave governance може да намали прага на ликвидация." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Заемополучатели описват ",
      morning("как се събуждат с ликвидирана позиция"),
      ", ",
      failedRepays("час неуспешни транзакции за погасяване"),
      " и ",
      polygon("погасяване при 1,01, което дойде твърде късно"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "Ликвидаторът задържа и бонус: 5 % за WETH на пазара Ethereum Core (октомври 2026 г.).",
      guide && rich(" Вижте ", guide("как протича ликвидацията"), "."),
    ),
  chart: {
    threshold: "вашият праг",
    liquidation: "ликвидация",
    alertSent: "Известието е изпратено",
    youCheck: "Проверявате телефона си",
    caption:
      "Примерна нощ. Известието излиза в 03:05, при първата проверка под 1,5, пет часа преди да погледнете телефона.",
  },

  howItWorksTitle: "Как работи",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` в мрежата ${paymentChain}` : "";
    return [
      {
        title: "Свържете портфейла, с който заемате",
        body: "Само за четене. Aave и Morpho, всяко на своя страница.",
      },
      {
        title: plan
          ? `Отключете известията за ${formatDecimal("bg", plan.priceLabel)}`
          : "Отключете известията с малко плащане в USDC",
        body: `${plan ? `${capitalize(bgForDays(plan.days))}, плащане` : "Плащане"} в USDC${paidOn}. Без автоматично подновяване.`,
      },
      {
        title: "Изберете граница за всеки пазар",
        body: `От ${formatDecimal("bg", threshold.min)} (в Morpho от ${formatDecimal("bg", morphoMin)}) до ${formatDecimal("bg", threshold.max)}, по подразбиране ${formatDecimal("bg", threshold.default)}.`,
      },
      {
        title: "Получавайте съобщения, докато сте под нея",
        body: `${capitalize(bgEveryMinutes(minutes))}, чрез ${channels}, докато не се върнете над границата си.`,
      },
    ];
  },
  scaleTitle: "Къде да поставите границата",
  scale: {
    liquidation: "ликвидация",
    critical: "Критичен",
    risky: "Рисков",
    safe: "Безопасен",
    defaultThreshold: value => `По подразбиране ${value}`,
    below: value => `Под ${value}`,
    between: (from, to) => `От ${from} до ${to}`,
    andAbove: value => `${value} и повече`,
    range: (min, max) => `Всяка стойност от ${min} до ${max}.`,
  },
  scaleGuide: "Как да изберете праг",

  coverageTitle: "Всеки пазар на Aave и всеки изброен пазар на Morpho",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${bgMarkets(v3Markets)} на Aave V3 ${bgOnNetworks(v3Networks)} и ${bgSpokes(spokes)} на Aave V4 ${bgOnNetworks(v4Networks)}, към 16 октомври 2026 г., както и всеки изброен пазар на Morpho ${bgOnNetworks(morphoNetworks)}.`,
  coverage: {
    v3Markets: count => `${bgMarkets(count)} V3`,
    v4Spokes: count => `${bgSpokes(count)} V4`,
    morpho: "Morpho",
  },
  coverageNote:
    "Пазарите в мрежите Scroll, ZKsync, Metis, Soneium и Sonic се закриват от governance на Aave и все още се наблюдават. Не са обхванати: Aave V3 в мрежата Harmony, неизброените пазари на Morpho и други протоколи.",

  pricingTitle: "Цени",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Известия", detail: capitalize(alertPrice) },
    { term: "Подновяване", detail: "Няма автоматично: платете отново, когато искате повече време" },
    {
      term: "Плащане",
      detail: paymentChain
        ? `USDC в мрежата ${paymentChain}, от портфейла ви (одобрение, после плащане)`
        : "USDC, от портфейла ви",
    },
  ],
  priceSource: "Цената се чете от контракта за плащане и се обновява на всеки час.",
  pricingFootnote: "Разглеждането на позициите ви не изисква плащане.",

  questionsTitle: "Въпроси, които да зададете, преди да свържете портфейл",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = bgOnChain(paymentChain);
    return [
      {
        question: "Може ли Tokenping да докосне средствата ми?",
        answer: rich(
          `Не. Tokenping само чете позициите ви и никога не иска одобрение или подпис в Aave или Morpho. Единствените транзакции са плащането ${onChain}: одобрение точно за цената, а после плащането. `,
          links.sourcify
            ? rich(
                "Контрактът е ",
                links.sourcify("проверен в Sourcify"),
                ", а неговият ",
                links.sourceCode("изходен код е публичен"),
              )
            : links.sourceCode("Изходният код на контракта е публичен"),
          "; портфейлът на екипа може да променя цената му, да го спира временно и да го обновява.",
        ),
      },
      {
        question: "Какво съхранявате?",
        answer: rich(
          "Адреса на портфейла ви, известията ви и данните за контакт, които сте дали (имейл, потребителско име в Signal",
          hasTelegram ? ", чат в Telegram" : "",
          `). Без история и без бисквитки за проследяване; посещенията на страниците се броят анонимно. Тези данни за контакт може да прочете само някой, който може да подписва с портфейла ви, но плащанията ${onChain} са публични. Пълният списък е на `,
          links.privacy("страницата за поверителност"),
          ".",
        ),
      },
      {
        question: "Колко струва?",
        answer: rich(
          `Цена на известията: ${alertPrice}, в USDC ${onChain}, плюс малко ETH за gas. Разглеждането на позициите ви не изисква плащане. Без автоматично подновяване, без възстановяване на суми.`,
        ),
      },
      {
        question: "Кои заеми в Morpho са обхванати?",
        answer: rich(
          `Заеми в Morpho Blue (променлива лихва) и Morpho Midnight (фиксирана лихва) на пазарите, изброени в приложението Morpho, с прагове от ${formatDecimal("bg", morphoMin)}. Заем с фиксирана лихва получава и напомняния преди падежа. Същият план ги покрива: отворете `,
          links.morphoDashboard("таблото за Morpho"),
          ".",
        ),
      },
      {
        question: "Ами ако известието не пристигне?",
        answer: rich(
          `Следващата проверка, ${minutes === 1 ? "една минута" : `${minutes} минути`} по-късно, опитва отново. Доставката зависи от Resend, релеен сървър за Signal, `,
          hasTelegram ? "Telegram Bot API, " : "",
          "публични RPC възли и планировчика на Vercel, без гаранция за непрекъсната работа. Изберете два канала и си оставете време да реагирате.",
        ),
      },
      {
        question: "Как да спра известията?",
        answer: rich(
          "Спират, щом health factor се върне над границата ви или когато изтриете известието (изисква активен достъп). Достъпът ви е изтекъл? Пишете ни в ",
          links.x("X"),
          " или в общността ни в ",
          links.telegramCommunity("Telegram"),
          " или ",
          links.signalCommunity("Signal"),
          ".",
          hasTelegram ? " В Telegram работи и /stop." : "",
          " Все още няма отлагане и няма връзка за отписване.",
        ),
      },
      {
        question: "Мога ли да следя портфейл, който не свързвам?",
        answer: rich("Засега не. Един портфейл, този, който свържете; достъпът е за всеки портфейл поотделно."),
      },
      {
        question: "Други инструменти не струват нищо. Защо да плащам?",
        answer: rich(
          "Ако ви подхожда бот в Telegram или мобилно приложение, използвайте него",
          links.comparison ? rich(": ", links.comparison("нашето сравнение"), " ги описва") : null,
          ". Tokenping е за известия чрез Signal или имейл, на всеки пазар на Aave и всеки изброен пазар на Morpho.",
        ),
      },
    ];
  },

  limitsTitle: "Ограниченията, казани направо",
  limits: ({ minutes, paymentChain }) => [
    `Проверка ${bgEveryMinutes(minutes)}, а не непрекъснато.`,
    "Всяка проверка под границата ви изпраща ново съобщение: без отлагане и без обобщения.",
    "Една граница на пазар, само за свързания портфейл.",
    `Само USDC${paymentChain ? ` в мрежата ${paymentChain}` : ""}: без карти, без възстановяване на суми.`,
    "В имейлите все още няма връзка за отписване; изтриването на известие изисква активен достъп.",
    "Бета: доставка чрез външни услуги, без гаранция за непрекъсната работа.",
  ],

  blogTitle: "От блога",
  allGuides: "Всички ръководства за Aave и Morpho",

  closingTitle: "Задайте известие за health factor в Aave или Morpho",
  closingLead: alertPrice => `${capitalize(alertPrice)}, плащане от портфейла ви. Без автоматично подновяване.`,
};
