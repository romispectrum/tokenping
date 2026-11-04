import type { CalculatorMessages } from "./shared";
import { joinList, ruOnMarket } from "~~/i18n/format";

// The calculator reads and shows numbers the app's way (a decimal point, "$2,400.00"), so the examples, hints and
// results keep the decimal point and group thousands with a space, which reads the same either way. An asset's name
// follows a noun ("цена WETH", "токен WETH") or a colon ("Цена ликвидации: WETH"), so the name itself never needs an
// ending.

export const MESSAGES: CalculatorMessages = {
  title: "Калькулятор цены ликвидации в Aave",
  intro:
    "Введите каждый залоговый актив и свой долг, чтобы получить health factor и цены, при которых позицию могут ликвидировать. Калькулятор использует формулу Aave V3: Σ(стоимость залога × порог ликвидации) ÷ стоимость долга.",
  examplesLabel: "Загрузить разобранный пример:",
  examples: {
    "one-collateral": "10 WETH, долг 12 000 USDC",
    "two-collaterals": "10 WETH + 0.2 WBTC, долг 20 000 USDC",
    "volatile-debt": "10 000 USDC, занято 2.5 WETH",
  },
  defaultCollateralName: index => `Залог ${index}`,
  defaultDebtName: "Занятый актив",
  collateralLegend: index => `Залог ${index}`,
  presetLabel: "Актив Aave V3 (заполняет порог)",
  eModeHint: (collateral, borrowable) =>
    `Этот порог действует для: ${joinList("ru", collateral)}. Остальной залог сохраняет свой порог. В этой категории E-Mode можно занимать только: ${joinList("ru", borrowable)}.`,
  otherAsset: "Другой актив: введите порог вручную",
  presetGroup: (market, date) => `${market} (данные на ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode «ETH correlated» (например, WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (нативный)",
  },
  nameLabel: "Название актива",
  namePlaceholder: symbols => `например, ${joinList("ru", symbols, "disjunction")}`,
  amountSupplied: "Внесённое количество",
  price: "Цена (USD)",
  priceHint: "Цена оракула Aave, указана на странице актива в приложении Aave.",
  threshold: "Порог ликвидации (%)",
  thresholdHint: "В режиме E-Mode это порог категории. В Aave V4 это collateral factor.",
  removeCollateral: index => `Удалить залог ${index}`,
  addCollateral: "Добавить второй залог",
  debtLegend: "Долг",
  debtKindLegend: "Что вы заняли?",
  debtKinds: { stable: "Stablecoin (считается по $1.00)", volatile: "Актив с меняющейся ценой, например WETH" },
  debtAmount: { stable: "Сумма займа (USD)", volatile: "Занятое количество (токены)" },
  debtAmountHint: "Включите проценты, начисленные на сегодня.",
  debtPrice: "Цена занятого актива (USD)",
  errors: {
    number: "Введите число, например 10 или 0.25, с точкой в качестве десятичного разделителя.",
    price: "Введите цену больше 0.",
    threshold: "Введите процент больше 0 и не больше 100.",
    samePrice: (name, price) =>
      `Токен ${name} уже введён выше по цене ${price}. Используйте ту же цену: у одного актива одна цена.`,
  },
  eModeLead: "Результата нет: Aave не допускает такое сочетание.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("ru", borrowable);
    const loanText = loan.kind === "stable" ? "займом в stablecoin" : `займом токена ${loan.name}`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `Категория E-Mode «${category}» ${ruOnMarket(market, "market")} позволяет занимать только: ${borrowableList}. ` +
      `Поэтому счёт с ${loanText} не может использовать её порог ${thresholdPercent} %. Выберите вместо него собственный порог залога${own} или займите что-то из этого: ${borrowableList}.`
    );
  },
  results: {
    heading: "Результат",
    empty: "Введите число в каждое поле, чтобы увидеть результат.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Health factor",
    noDebt: "Долга нет, поэтому ликвидировать нечего.",
    liquidatableNow: "Ниже 1.00: позицию можно ликвидировать уже сейчас.",
    liquidatableBelow: "Позицию можно ликвидировать ниже 1.00.",
    none: "Нет",
    priceTitle: name => `Цена ликвидации: ${name}`,
    priceTitleBorrowed: name => `Цена ликвидации: ${name} (занято)`,
    priceTitleShared: name => `Цена ликвидации: ${name} (внесено и занято)`,
    recover: ({ name, change, now, rises, alike }) =>
      `Health factor вернётся к 1.00, если цена ${name}${alike ? " (внесённого и занятого одинаково)" : ""} ${
        rises ? "вырастет" : "упадёт"
      } на ${change} от ${now}, а остальные цены не изменятся.`,
    collateralFall: ({ change, now }) => `На ${change} ниже ${now}, если все остальные цены не изменятся.`,
    collateralNone: name =>
      `Даже при цене $0 один только токен ${name} не может опустить health factor ниже 1.00: остальной залог покрывает долг.`,
    debtRise: ({ change, now }) =>
      `На ${change} выше ${now}: занятые активы опускают health factor, когда их цена растёт.`,
    sharedRise: ({ name, change, now }) =>
      `На ${change} выше ${now}: ваш долг в токене ${name} больше той части вашего залога в токене ${name}, которая засчитывается, поэтому рост цены опускает health factor. Остальные цены без изменений.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `На ${change} ниже ${now}, при той же цене занятого токена ${name} и без изменений всех остальных цен.`,
    sharedFallRows: ({ name, change, now }) =>
      `На ${change} ниже ${now} для каждой строки с токеном ${name}, если все остальные цены не изменятся.`,
    bothSidesNeutral: name =>
      `Токен ${name} одновременно ваш залог и ваш долг, поэтому обе стороны движутся вместе и его цена не меняет health factor. Проценты, изменение порога или ваши собственные транзакции всё же меняют его.`,
    bothSidesRecover: name =>
      `Токен ${name} есть на обеих сторонах, поэтому они движутся вместе: никакая цена токена ${name} сама по себе не вернёт health factor к 1.00.`,
    bothSidesSafe: name =>
      `Токен ${name} есть на обеих сторонах, поэтому они движутся вместе: одна его цена не может опустить health factor ниже 1.00.`,
    uniformTitle: "Весь залог падает вместе",
    uniformDescription: prices =>
      `Если цена каждого залога упадёт настолько, а цена долга не изменится, health factor дойдёт до 1.00: ${joinList(
        "ru",
        prices.map(({ name, price }) => `${name}: ${price}`),
      )}.`,
    ratioTitle: (numerator, denominator) => `Соотношение цен ${numerator} ÷ ${denominator} при ликвидации`,
    ratioDescription: (now, change, falls) =>
      `Сейчас ${now}. Если меняются обе цены, ${falls ? "падение" : "рост"} этого соотношения на ${change} доводит health factor до 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Залог ${collateral}, с учётом порогов ликвидации: ${weighted}. Health factor = ${weighted} ÷ ${debt} долга = ${healthFactor}.`,
  },
  noscript:
    "Для пересчёта калькулятору нужен JavaScript. Результат выше дан для 10 WETH по $2 400 (порог ликвидации 83 %) при долге 12 000 USDC; разобранные примеры на этой странице используют ту же формулу.",
  disclaimer: {
    lead: "Учебная оценка, а не финансовая рекомендация.",
    beforeDate:
      "Калькулятор использует только введённые вами числа. Текущие параметры Aave могут меняться: пороги выше прочитаны из блокчейна",
    afterDate:
      ", и governance или Risk Stewards могут изменить их в любой момент. Цены оракула меняются, проценты постоянно увеличивают ваш долг, а каждая цена ликвидации предполагает, что все остальные цены не меняются. Прежде чем действовать, проверьте свою позицию в приложении Aave.",
  },
};
