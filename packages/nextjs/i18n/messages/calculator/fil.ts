import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

// Filipino writes numbers as English does ("12,000", "0.25", "$2,400"), the same way the calculator reads and shows them.
export const MESSAGES: CalculatorMessages = {
  title: "Aave liquidation price calculator",
  intro:
    "Ilagay ang bawat collateral na asset at ang utang mo para makita ang health factor at ang mga presyo kung saan puwedeng ma-liquidate ang posisyon. Ginagamit nito ang formula ng Aave V3: Σ(halaga ng collateral × liquidation threshold) ÷ halaga ng utang.",
  examplesLabel: "Mag-load ng halimbawang kuwenta:",
  examples: {
    "one-collateral": "10 WETH, utang na 12,000 USDC",
    "two-collaterals": "10 WETH + 0.2 WBTC, utang na 20,000 USDC",
    "volatile-debt": "10,000 USDC, 2.5 WETH ang hiniram",
  },
  defaultCollateralName: index => `Collateral ${index}`,
  defaultDebtName: "Asset ng utang",
  collateralLegend: index => `Collateral ${index}`,
  presetLabel: "Asset sa Aave V3 (pinupunan ang threshold)",
  eModeHint: (collateral, borrowable) =>
    `Sa threshold na ito binibilang ang ${joinList("fil", collateral)}; ang ibang collateral ay may sariling threshold. Sa E-Mode na ito, ${joinList("fil", borrowable, "disjunction")} lang ang puwede mong i-borrow.`,
  otherAsset: "Ibang asset: ikaw ang maglagay ng threshold",
  presetGroup: (market, date) => `${market} (binasa noong ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode “ETH correlated” (hal. WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (native)",
  },
  nameLabel: "Pangalan ng asset",
  namePlaceholder: symbols => `hal. ${joinList("fil", symbols, "disjunction")}`,
  amountSupplied: "Halagang naka-deposit",
  price: "Presyo (USD)",
  priceHint: "Ang presyo ayon sa oracle ng Aave, makikita sa page ng asset sa Aave app.",
  threshold: "Liquidation threshold (%)",
  thresholdHint: "Sa E-Mode, ang threshold ng category. Sa Aave V4, ang collateral factor.",
  removeCollateral: index => `Alisin ang collateral ${index}`,
  addCollateral: "Magdagdag ng pangalawang collateral",
  debtLegend: "Utang",
  debtKindLegend: "Ano ang hiniram mo?",
  debtKinds: { stable: "Stablecoin (binibilang sa $1.00)", volatile: "Asset na pabago-bago ang presyo, tulad ng WETH" },
  debtAmount: { stable: "Halagang hiniram (USD)", volatile: "Halagang hiniram (token)" },
  debtAmountHint: "Isama ang interes na naipon na.",
  debtPrice: "Presyo ng hiniram na asset (USD)",
  errors: {
    number: "Maglagay ng numero tulad ng 10 o 0.25, may tuldok para sa decimal.",
    price: "Maglagay ng presyong higit sa 0.",
    threshold: "Maglagay ng porsyentong higit sa 0 at hindi lalampas sa 100.",
    samePrice: (name, price) =>
      `Nailagay na sa itaas ang ${name} sa presyong ${price}. Gamitin ang parehong presyo: iisa ang presyo ng isang asset.`,
  },
  eModeLead: "Walang resulta: hindi pinapayagan ng Aave ang kombinasyong ito.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("fil", borrowable);
    const borrowableChoice = joinList("fil", borrowable, "disjunction");
    const loanText = loan.kind === "stable" ? "stablecoin na loan" : `hiniram na ${loan.name}`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `Sa E-Mode na “${category}” ng ${market}, ${borrowableList} lang ang puwedeng i-borrow, kaya hindi magagamit ng account na may ${loanText} ` +
      `ang ${thresholdPercent}% na threshold nito. Piliin na lang ang sariling threshold ng collateral${own}, o i-borrow ang ${borrowableChoice}.`
    );
  },
  results: {
    heading: "Resulta",
    empty: "Maglagay ng numero sa bawat field para makita ang resulta.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Health factor",
    noDebt: "Walang utang, kaya walang mali-liquidate.",
    liquidatableNow: "Mas mababa sa 1.00: puwede nang ma-liquidate ang posisyon ngayon.",
    liquidatableBelow: "Puwedeng ma-liquidate ang posisyon kapag mas mababa sa 1.00.",
    none: "Wala",
    priceTitle: name => `Liquidation price ng ${name}`,
    priceTitleBorrowed: name => `Liquidation price ng ${name} (hiniram)`,
    priceTitleShared: name => `Liquidation price ng ${name} (naka-deposit at hiniram)`,
    recover: ({ name, change, now, rises, alike }) =>
      `Babalik sa 1.00 ang health factor kung ${rises ? "tataas" : "bababa"} ang ${name} nang ${change} mula ${now}${
        alike ? ", pareho ang naka-deposit at hiniram" : ""
      }, at walang pagbabago sa ibang presyo.`,
    collateralFall: ({ change, now }) =>
      `${change} mas mababa sa ${now}, kung walang pagbabago sa lahat ng ibang presyo.`,
    collateralNone: name =>
      `Kahit sa $0, hindi kayang ibaba ng ${name} nang mag-isa ang health factor sa ilalim ng 1.00: sakop ng ibang collateral ang utang.`,
    debtRise: ({ change, now }) =>
      `${change} mas mataas sa ${now}: ibinababa ng mga hiniram na asset ang health factor kapag tumataas ang presyo nila.`,
    sharedRise: ({ name, change, now }) =>
      `${change} mas mataas sa ${now}: mas marami ang hiniram mong ${name} kaysa sa binibilang ng ${name} collateral mo, kaya ibinababa ng pagtaas ang health factor. Walang pagbabago sa ibang presyo.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `${change} mas mababa sa ${now}, kasama ang hiniram na ${name} sa parehong presyo at walang pagbabago sa lahat ng ibang presyo.`,
    sharedFallRows: ({ name, change, now }) =>
      `${change} mas mababa sa ${now} para sa bawat row ng ${name}, kung walang pagbabago sa lahat ng ibang presyo.`,
    bothSidesNeutral: name =>
      `Ang ${name} ay parehong collateral at utang mo, kaya sabay silang gumagalaw at hindi binabago ng presyo nito ang health factor. Binabago pa rin ito ng interes, ng pagbabago sa threshold o ng sarili mong mga transaksyon.`,
    bothSidesRecover: name =>
      `Nasa magkabilang panig ang ${name}, kaya sabay silang gumagalaw: walang presyo ng ${name} na mag-isang magbabalik sa health factor sa 1.00.`,
    bothSidesSafe: name =>
      `Nasa magkabilang panig ang ${name}, kaya sabay silang gumagalaw: hindi kayang ibaba ng presyo nito nang mag-isa ang health factor sa ilalim ng 1.00.`,
    uniformTitle: "Sabay-sabay na bumababa ang lahat ng collateral",
    uniformDescription: prices =>
      `Kung bababa nang ganito ang presyo ng bawat collateral at hindi gagalaw ang presyo ng utang, aabot sa 1.00 ang health factor: ${prices
        .map(({ name, price }) => `${name} sa ${price}`)
        .join(" at ")}.`,
    ratioTitle: (numerator, denominator) => `Presyo ng ${numerator} ÷ ${denominator} sa liquidation`,
    ratioDescription: (now, change, falls) =>
      `Ngayon ay ${now}. Kung gagalaw ang dalawang presyo, ang ${change} na ${falls ? "pagbaba" : "pagtaas"} ng ratio na ito ang magdadala sa health factor sa 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Collateral na ${collateral}, binilang sa mga liquidation threshold nito: ${weighted}. Health factor = ${weighted} ÷ ${debt} na utang = ${healthFactor}.`,
  },
  noscript:
    "Kailangan ng calculator ang JavaScript para magkuwenta ulit. Ang resulta sa itaas ay para sa 10 WETH sa $2,400 (liquidation threshold na 83%) laban sa 12,000 USDC; pareho ang formula na ginagamit ng mga halimbawang kuwenta sa page na ito.",
  disclaimer: {
    lead: "Pang-edukasyong tantya, hindi payong pinansyal.",
    beforeDate:
      "Ang mga numerong inilagay mo lang ang ginagamit nito. Puwedeng magbago ang kasalukuyang mga parameter ng Aave: binasa on-chain ang mga threshold sa itaas noong",
    afterDate:
      ", at puwede itong baguhin ng governance o ng Risk Stewards anumang oras. Gumagalaw ang mga presyo ng oracle, patuloy na nadaragdagan ng interes ang utang mo, at inaakala ng bawat liquidation price na walang pagbabago sa lahat ng ibang presyo. Tingnan ang posisyon mo sa Aave app bago ka kumilos.",
  },
};
