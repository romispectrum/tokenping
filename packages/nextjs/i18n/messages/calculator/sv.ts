import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

// The calculator reads and shows numbers the app's way (a decimal point, "$2,400.00"), so the examples, hints and
// results keep the decimal point and group thousands with a space, which reads the same either way.
export const MESSAGES: CalculatorMessages = {
  title: "Kalkylator för likvidationspris på Aave",
  intro:
    "Ange varje säkerhet och din skuld för att se health factor och de priser där positionen kan likvideras. Kalkylatorn använder formeln för Aave V3: Σ(säkerhetens värde × likvidationströskel) ÷ skuldens värde.",
  examplesLabel: "Ladda ett räkneexempel:",
  examples: {
    "one-collateral": "10 WETH, 12 000 USDC i skuld",
    "two-collaterals": "10 WETH + 0.2 WBTC, 20 000 USDC i skuld",
    "volatile-debt": "10 000 USDC, 2.5 WETH lånat",
  },
  defaultCollateralName: index => `Säkerhet ${index}`,
  defaultDebtName: "Lånad tillgång",
  collateralLegend: index => `Säkerhet ${index}`,
  presetLabel: "Tillgång på Aave V3 (fyller i tröskeln)",
  eModeHint: (collateral, borrowable) =>
    `Den här tröskeln gäller för ${joinList("sv", collateral)}; annan säkerhet behåller sin egen. I det här E-Mode kan du bara låna ${joinList("sv", borrowable)}.`,
  otherAsset: "Annan tillgång: ange tröskeln själv",
  presetGroup: (market, date) => `${market} (läst ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode ”ETH correlated” (t.ex. WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (native)",
  },
  nameLabel: "Tillgångens namn",
  namePlaceholder: symbols => `t.ex. ${joinList("sv", symbols, "disjunction")}`,
  amountSupplied: "Insatt mängd",
  price: "Pris (USD)",
  priceHint: "Aaves orakelpris, som visas på tillgångens sida i Aave-appen.",
  threshold: "Likvidationströskel (%)",
  thresholdHint: "I E-Mode kategorins tröskel. På Aave V4 collateral factor.",
  removeCollateral: index => `Ta bort säkerhet ${index}`,
  addCollateral: "Lägg till en andra säkerhet",
  debtLegend: "Skuld",
  debtKindLegend: "Vad har du lånat?",
  debtKinds: { stable: "En stablecoin (räknas som $1.00)", volatile: "En volatil tillgång, till exempel WETH" },
  debtAmount: { stable: "Lånat belopp (USD)", volatile: "Lånad mängd (tokens)" },
  debtAmountHint: "Räkna med räntan som har lagts till hittills.",
  debtPrice: "Pris på den lånade tillgången (USD)",
  errors: {
    number: "Ange ett tal som 10 eller 0.25, med punkt för decimaler.",
    price: "Ange ett pris över 0.",
    threshold: "Ange en procentsats över 0 och högst 100.",
    samePrice: (name, price) =>
      `${name} är redan angivet ovan till ${price}. Använd samma pris: en tillgång har ett pris.`,
  },
  eModeLead: "Inget resultat: Aave tillåter inte den här kombinationen.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("sv", borrowable);
    const loanText = loan.kind === "stable" ? "ett lån i stablecoin" : `lånad ${loan.name}`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `Med E-Mode ”${category}” på ${market} kan du bara låna ${borrowableList}, så ett konto med ${loanText} ` +
      `kan inte använda tröskeln på ${thresholdPercent} %. Välj säkerhetens egen tröskel i stället${own}, eller låna ${borrowableList}.`
    );
  },
  results: {
    heading: "Resultat",
    empty: "Ange ett tal i varje fält för att se resultatet.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Health factor",
    noDebt: "Ingen skuld, så det finns inget att likvidera.",
    liquidatableNow: "Under 1.00: positionen kan likvideras nu.",
    liquidatableBelow: "Positionen kan likvideras under 1.00.",
    none: "Inget",
    priceTitle: name => `Likvidationspris för ${name}`,
    priceTitleBorrowed: name => `Likvidationspris för ${name} (lånat)`,
    priceTitleShared: name => `Likvidationspris för ${name} (insatt och lånat)`,
    recover: ({ name, change, now, rises, alike }) =>
      `Health factor kommer tillbaka till 1.00 om ${name}${alike ? " (insatt och lånat)" : ""} ${
        rises ? "stiger" : "faller"
      } ${change} från ${now}, med övriga priser oförändrade.`,
    collateralFall: ({ change, now }) => `${change} under ${now}, om alla andra priser är oförändrade.`,
    collateralNone: name =>
      `Även vid $0 kan ${name} ensamt inte ta health factor under 1.00: den andra säkerheten täcker skulden.`,
    debtRise: ({ change, now }) =>
      `${change} över ${now}: lånade tillgångar trycker ned health factor när deras pris stiger.`,
    sharedRise: ({ name, change, now }) =>
      `${change} över ${now}: du har lånat mer ${name} än din säkerhet i ${name} räknas för, så en uppgång trycker ned health factor. Övriga priser oförändrade.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `${change} under ${now}, med lånad ${name} till samma pris och alla andra priser oförändrade.`,
    sharedFallRows: ({ name, change, now }) =>
      `${change} under ${now} för varje rad med ${name}, om alla andra priser är oförändrade.`,
    bothSidesNeutral: name =>
      `${name} är både din säkerhet och din skuld, så båda rör sig tillsammans och priset ändrar inte health factor. Ränta, en ändrad tröskel eller dina egna transaktioner ändrar den fortfarande.`,
    bothSidesRecover: name =>
      `${name} finns på båda sidor, så båda rör sig tillsammans: inget pris på ${name} ensamt för tillbaka health factor till 1.00.`,
    bothSidesSafe: name =>
      `${name} finns på båda sidor, så båda rör sig tillsammans: priset ensamt kan inte ta health factor under 1.00.`,
    uniformTitle: "All säkerhet faller samtidigt",
    uniformDescription: prices =>
      `Om priset på varje säkerhet faller så här mycket och skuldens pris inte rör sig, når health factor 1.00: ${joinList(
        "sv",
        prices.map(({ name, price }) => `${name} på ${price}`),
      )}.`,
    ratioTitle: (numerator, denominator) => `Prisförhållande ${numerator} ÷ ${denominator} vid likvidation`,
    ratioDescription: (now, change, falls) =>
      `Nu ${now}. Om båda priserna rör sig tar ${falls ? "en nedgång" : "en uppgång"} på ${change} i det här förhållandet health factor till 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Säkerhet ${collateral}, räknad med sina likvidationströsklar: ${weighted}. Health factor = ${weighted} ÷ ${debt} i skuld = ${healthFactor}.`,
  },
  noscript:
    "Kalkylatorn behöver JavaScript för att räkna om. Resultatet ovan gäller 10 WETH till $2 400 (likvidationströskel 83 %) mot 12 000 USDC i skuld; räkneexemplen på den här sidan använder samma formel.",
  disclaimer: {
    lead: "En uppskattning i utbildningssyfte, inte finansiell rådgivning.",
    beforeDate:
      "Den använder bara de tal du anger. Aaves aktuella parametrar kan ändras: tröskelvärdena ovan lästes on-chain den",
    afterDate:
      ", och governance eller Risk Stewards kan ändra dem när som helst. Orakelpriser rör sig, räntan fortsätter att öka din skuld och varje likvidationspris förutsätter att alla andra priser är oförändrade. Kontrollera din position i Aave-appen innan du agerar.",
  },
};
