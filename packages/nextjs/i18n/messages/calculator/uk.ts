import type { CalculatorMessages } from "./shared";
import { joinList, ukOnMarket } from "~~/i18n/format";

// The calculator reads and shows numbers the app's way (a decimal point, "$2,400.00"), so the examples, hints and
// results keep the decimal point and group thousands with a space, which reads the same either way. An asset's name
// follows a noun that takes the case ("ціна токена WETH") or a colon ("Ціна ліквідації: WETH"), so the name itself
// never needs an ending.
export const MESSAGES: CalculatorMessages = {
  title: "Калькулятор ціни ліквідації в Aave",
  intro:
    "Введіть кожен актив застави і свій борг, щоб побачити health factor і ціни, за яких позицію можуть ліквідувати. Калькулятор використовує формулу Aave V3: Σ(вартість застави × поріг ліквідації) ÷ вартість боргу.",
  examplesLabel: "Завантажити приклад із розрахунком:",
  examples: {
    "one-collateral": "10 WETH, борг 12 000 USDC",
    "two-collaterals": "10 WETH + 0.2 WBTC, борг 20 000 USDC",
    "volatile-debt": "10 000 USDC, позичено 2.5 WETH",
  },
  defaultCollateralName: index => `Застава ${index}`,
  defaultDebtName: "Позичений актив",
  collateralLegend: index => `Застава ${index}`,
  presetLabel: "Актив Aave V3 (заповнює поріг)",
  eModeHint: (collateral, borrowable) =>
    `Цей поріг діє для: ${joinList("uk", collateral)}. Інша застава зберігає власний поріг. У цьому E-Mode можна позичати лише: ${joinList("uk", borrowable)}.`,
  otherAsset: "Інший актив: введіть поріг самостійно",
  presetGroup: (market, date) => `${market} (зчитано ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode «ETH correlated» (напр. WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (нативний)",
  },
  nameLabel: "Назва активу",
  namePlaceholder: symbols => `напр. ${joinList("uk", symbols, "disjunction")}`,
  amountSupplied: "Внесена кількість",
  price: "Ціна (USD)",
  priceHint: "Ціна з оракула Aave, показана на сторінці активу в застосунку Aave.",
  threshold: "Поріг ліквідації (%)",
  thresholdHint: "У E-Mode це поріг категорії. В Aave V4 це collateral factor.",
  removeCollateral: index => `Видалити заставу ${index}`,
  addCollateral: "Додати другу заставу",
  debtLegend: "Борг",
  debtKindLegend: "Що ви позичили?",
  debtKinds: { stable: "Stablecoin (рахується за $1.00)", volatile: "Актив зі змінною ціною, напр. WETH" },
  debtAmount: { stable: "Позичена сума (USD)", volatile: "Позичена кількість (токени)" },
  debtAmountHint: "Додайте відсотки, нараховані досі.",
  debtPrice: "Ціна позиченого активу (USD)",
  errors: {
    number: "Введіть число, напр. 10 або 0.25, з крапкою як десятковим знаком.",
    price: "Введіть ціну, більшу за 0.",
    threshold: "Введіть відсоток, більший за 0 і не більший за 100.",
    samePrice: (name, price) =>
      `Токен ${name} уже введено вище з ціною ${price}. Використайте ту саму ціну: в одного активу одна ціна.`,
  },
  eModeLead: "Результату немає: Aave не дозволяє такої комбінації.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("uk", borrowable);
    const loanText = loan.kind === "stable" ? "позиченим stablecoin" : `позиченим токеном ${loan.name}`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `Категорія E-Mode «${category}» ${ukOnMarket(market, "market")} дозволяє позичати лише таке: ${borrowableList}. ` +
      `Тому рахунок з ${loanText} не може використати її поріг ${thresholdPercent} %. Натомість виберіть власний поріг застави${own} або позичте щось із цього: ${borrowableList}.`
    );
  },
  results: {
    heading: "Результат",
    empty: "Введіть число в кожне поле, щоб побачити результат.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Health factor",
    noDebt: "Боргу немає, тож ліквідувати нічого.",
    liquidatableNow: "Нижче 1.00: позицію можуть ліквідувати вже зараз.",
    liquidatableBelow: "Позицію можуть ліквідувати нижче 1.00.",
    none: "Немає",
    priceTitle: name => `Ціна ліквідації: ${name}`,
    priceTitleBorrowed: name => `Ціна ліквідації: ${name} (позичено)`,
    priceTitleShared: name => `Ціна ліквідації: ${name} (внесено і позичено)`,
    recover: ({ name, change, now, rises, alike }) =>
      `Health factor повернеться до 1.00, якщо ціна токена ${name}${alike ? " (внесеного і позиченого однаково)" : ""} ${
        rises ? "зросте" : "впаде"
      } на ${change} від ${now}, а інші ціни не зміняться.`,
    collateralFall: ({ change, now }) => `На ${change} нижче ${now}, якщо всі інші ціни не зміняться.`,
    collateralNone: name =>
      `Навіть за ціни $0 сам токен ${name} не може опустити health factor нижче 1.00: інша застава покриває борг.`,
    debtRise: ({ change, now }) =>
      `На ${change} вище ${now}: позичені активи знижують health factor, коли їхня ціна зростає.`,
    sharedRise: ({ name, change, now }) =>
      `На ${change} вище ${now}: ваш борг у токені ${name} більший за ту частину застави в токені ${name}, яка враховується, тож зростання ціни знижує health factor. Інші ціни без змін.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `На ${change} нижче ${now}, за тієї самої ціни позиченого токена ${name} і без змін усіх інших цін.`,
    sharedFallRows: ({ name, change, now }) =>
      `На ${change} нижче ${now} для кожного рядка з токеном ${name}, якщо всі інші ціни не зміняться.`,
    bothSidesNeutral: name =>
      `Токен ${name} водночас ваша застава і ваш борг, тож обидві сторони рухаються разом і його ціна не змінює health factor. Проте його змінюють відсотки, зміна порогу або ваші власні транзакції.`,
    bothSidesRecover: name =>
      `Токен ${name} є з обох боків, тож вони рухаються разом: жодна ціна токена ${name} сама не поверне health factor до 1.00.`,
    bothSidesSafe: name =>
      `Токен ${name} є з обох боків, тож вони рухаються разом: сама його ціна не може опустити health factor нижче 1.00.`,
    uniformTitle: "Уся застава падає разом",
    uniformDescription: prices =>
      `Якщо ціна кожної застави впаде настільки, а ціна боргу не зміниться, health factor досягне 1.00: ${joinList(
        "uk",
        prices.map(({ name, price }) => `${name}: ${price}`),
      )}.`,
    ratioTitle: (numerator, denominator) => `Співвідношення цін ${numerator} ÷ ${denominator} під час ліквідації`,
    ratioDescription: (now, change, falls) =>
      `Зараз ${now}. Якщо зміняться обидві ціни, ${falls ? "падіння" : "зростання"} цього співвідношення на ${change} доведе health factor до 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Застава ${collateral}, урахована за порогами ліквідації: ${weighted}. Health factor = ${weighted} ÷ ${debt} боргу = ${healthFactor}.`,
  },
  noscript:
    "Для перерахунку калькулятору потрібен JavaScript. Результат вище стосується 10 WETH за $2 400 (поріг ліквідації 83 %) при боргу 12 000 USDC; приклади з розрахунками на цій сторінці використовують ту саму формулу.",
  disclaimer: {
    lead: "Освітня оцінка, а не фінансова порада.",
    beforeDate:
      "Вона використовує лише числа, які ви вводите. Поточні параметри Aave можуть змінюватися: пороги вище зчитано з блокчейну",
    afterDate:
      ", і governance або Risk Stewards можуть змінити їх будь-коли. Ціни оракула змінюються, відсотки постійно збільшують ваш борг, а кожна ціна ліквідації припускає, що всі інші ціни не змінюються. Перш ніж діяти, перевірте свою позицію в застосунку Aave.",
  },
};
