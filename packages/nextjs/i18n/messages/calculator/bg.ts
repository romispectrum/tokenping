import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

// The calculator reads and shows numbers the app's way (a decimal point, "$2,400.00"), so the examples, hints and
// results keep the decimal point and group thousands with a space, which reads the same either way. An asset's name
// follows a noun ("цената на WETH") or a colon ("Цена на ликвидация: WETH"), so it stays in Latin letters.
export const MESSAGES: CalculatorMessages = {
  title: "Калкулатор на цената на ликвидация в Aave",
  intro:
    "Въведете всеки актив за обезпечение и дълга си, за да видите health factor и цените, при които позицията може да бъде ликвидирана. Калкулаторът използва формулата на Aave V3: Σ(стойност на обезпечението × праг на ликвидация) ÷ стойност на дълга.",
  examplesLabel: "Заредете пример с изчисления:",
  examples: {
    "one-collateral": "10 WETH, дълг 12 000 USDC",
    "two-collaterals": "10 WETH + 0.2 WBTC, дълг 20 000 USDC",
    "volatile-debt": "10 000 USDC, заети 2.5 WETH",
  },
  defaultCollateralName: index => `Обезпечение ${index}`,
  defaultDebtName: "Зает актив",
  collateralLegend: index => `Обезпечение ${index}`,
  presetLabel: "Актив в Aave V3 (попълва прага)",
  eModeHint: (collateral, borrowable) =>
    `Този праг важи за: ${joinList("bg", collateral)}. Останалото обезпечение запазва своя праг. В тази категория E-Mode можете да заемате само: ${joinList("bg", borrowable)}.`,
  otherAsset: "Друг актив: въведете прага сами",
  presetGroup: (market, date) => `${market} (прочетено на ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode „ETH correlated“ (напр. WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (нативен)",
  },
  nameLabel: "Име на актива",
  namePlaceholder: symbols => `напр. ${symbols.join(" или ")}`,
  amountSupplied: "Внесено количество",
  price: "Цена (USD)",
  priceHint: "Цената от оракула на Aave, показана на страницата на актива в приложението Aave.",
  threshold: "Праг на ликвидация (%)",
  thresholdHint: "В E-Mode това е прагът на категорията. В Aave V4 е collateral factor.",
  removeCollateral: index => `Премахване на обезпечение ${index}`,
  addCollateral: "Добавяне на второ обезпечение",
  debtLegend: "Дълг",
  debtKindLegend: "Какво заехте?",
  debtKinds: { stable: "Stablecoin (броен като $1.00)", volatile: "Актив с променлива цена, например WETH" },
  debtAmount: { stable: "Заета сума (USD)", volatile: "Заето количество (токени)" },
  debtAmountHint: "Включете натрупаната досега лихва.",
  debtPrice: "Цена на заетия актив (USD)",
  errors: {
    number: "Въведете число, например 10 или 0.25, с точка за десетичния знак.",
    price: "Въведете цена над 0.",
    threshold: "Въведете процент над 0 и най-много 100.",
    samePrice: (name, price) =>
      `${name} вече е въведен по-горе с цена ${price}. Използвайте същата цена: един актив има една цена.`,
  },
  eModeLead: "Няма резултат: Aave не позволява тази комбинация.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("bg", borrowable);
    const loanText = loan.kind === "stable" ? "заем в stablecoin" : `зает ${loan.name}`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `E-Mode „${category}“ на пазара ${market} позволява да заемате само ${borrowableList}, затова акаунт с ${loanText} ` +
      `не може да използва неговия праг от ${thresholdPercent} %. Вместо това изберете собствения праг на обезпечението${own} или заемете ${borrowableList}.`
    );
  },
  results: {
    heading: "Резултат",
    empty: "Въведете число във всяко поле, за да видите резултата.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Health factor",
    noDebt: "Няма дълг, така че няма какво да се ликвидира.",
    liquidatableNow: "Под 1.00: позицията може да бъде ликвидирана сега.",
    liquidatableBelow: "Позицията може да бъде ликвидирана под 1.00.",
    none: "Няма",
    priceTitle: name => `Цена на ликвидация: ${name}`,
    priceTitleBorrowed: name => `Цена на ликвидация: ${name} (заето)`,
    priceTitleShared: name => `Цена на ликвидация: ${name} (внесено и заето)`,
    recover: ({ name, change, now, rises, alike }) =>
      `Health factor се връща до 1.00, ако цената на ${name}${alike ? " (внесено и заето)" : ""} ${
        rises ? "се покачи" : "падне"
      } с ${change} от ${now}, при непроменени други цени.`,
    collateralFall: ({ change, now }) => `С ${change} под ${now}, ако всички други цени останат същите.`,
    collateralNone: name =>
      `Дори при цена $0 само ${name} не може да свали health factor под 1.00: другото обезпечение покрива дълга.`,
    debtRise: ({ change, now }) =>
      `С ${change} над ${now}: заетите активи свалят health factor, когато цената им се покачва.`,
    sharedRise: ({ name, change, now }) =>
      `С ${change} над ${now}: заехте повече ${name}, отколкото се брои вашето обезпечение в ${name}, затова покачването на цената сваля health factor. Другите цени са непроменени.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `С ${change} под ${now}, при същата цена на заетия ${name} и непроменени всички други цени.`,
    sharedFallRows: ({ name, change, now }) =>
      `С ${change} под ${now} за всеки ред с ${name}, ако всички други цени останат същите.`,
    bothSidesNeutral: name =>
      `${name} е едновременно ваше обезпечение и ваш дълг, затова двете страни се движат заедно и цената му не променя health factor. Лихвата, промяна на прага или собствените ви транзакции обаче го променят.`,
    bothSidesRecover: name =>
      `${name} е и от двете страни, затова двете се движат заедно: никоя цена на ${name} сама по себе си не връща health factor до 1.00.`,
    bothSidesSafe: name =>
      `${name} е и от двете страни, затова двете се движат заедно: само цената му не може да свали health factor под 1.00.`,
    uniformTitle: "Цялото обезпечение пада заедно",
    uniformDescription: prices =>
      `Ако цената на всяко обезпечение падне толкова, а цената на дълга не се промени, health factor достига 1.00: ${prices
        .map(({ name, price }) => `${name} при ${price}`)
        .join(" и ")}.`,
    ratioTitle: (numerator, denominator) => `Съотношение на цените ${numerator} ÷ ${denominator} при ликвидация`,
    ratioDescription: (now, change, falls) =>
      `Сега ${now}. Ако и двете цени се движат, ${falls ? "спад" : "покачване"} на това съотношение с ${change} сваля health factor до 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Обезпечение ${collateral}, броено по праговете на ликвидация: ${weighted}. Health factor = ${weighted} ÷ ${debt} дълг = ${healthFactor}.`,
  },
  noscript:
    "Калкулаторът се нуждае от JavaScript, за да преизчислява. Резултатът по-горе е за 10 WETH при $2 400 (праг на ликвидация 83 %) срещу дълг от 12 000 USDC; примерите с изчисления на тази страница използват същата формула.",
  disclaimer: {
    lead: "Образователна оценка, а не финансов съвет.",
    beforeDate:
      "Използва само числата, които въведете. Текущите параметри на Aave могат да се променят: праговете по-горе са прочетени от блокчейна на",
    afterDate:
      ", а governance или Risk Stewards могат да ги променят по всяко време. Цените от оракула се движат, лихвата продължава да увеличава дълга ви, а всяка цена на ликвидация предполага, че всички други цени остават същите. Проверете позицията си в приложението Aave, преди да действате.",
  },
};
