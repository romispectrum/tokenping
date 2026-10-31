import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

export const MESSAGES: CalculatorMessages = {
  title: "Kalkulačka likvidační ceny na Aave",
  intro:
    "Zadejte každé aktivum v kolaterálu a svůj dluh a uvidíte health factor a ceny, při kterých může být pozice zlikvidována. Kalkulačka používá vzorec Aave V3: Σ(hodnota kolaterálu × likvidační práh) ÷ hodnota dluhu.",
  examplesLabel: "Načíst propočítaný příklad:",
  examples: {
    "one-collateral": "10 WETH, dluh 12\u00a0000 USDC",
    "two-collaterals": "10 WETH + 0.2 WBTC, dluh 20\u00a0000 USDC",
    "volatile-debt": "10\u00a0000 USDC, vypůjčeno 2.5 WETH",
  },
  defaultCollateralName: index => `Kolaterál ${index}`,
  defaultDebtName: "Vypůjčené aktivum",
  collateralLegend: index => `Kolaterál ${index}`,
  presetLabel: "Aktivum na Aave V3 (vyplní práh)",
  eModeHint: (collateral, borrowable) =>
    `Tento práh platí pro ${joinList("cs", collateral)}, ostatní kolaterál si ponechá svůj vlastní. V tomto E-Mode si můžete půjčit jen ${joinList("cs", borrowable)}.`,
  otherAsset: "Jiné aktivum: práh zadáte sami",
  presetGroup: (market, date) => `${market} (načteno ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode „ETH correlated“ (např. WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (nativní)",
  },
  nameLabel: "Název aktiva",
  namePlaceholder: symbols => `např. ${symbols.join(" nebo ")}`,
  amountSupplied: "Vložené množství",
  price: "Cena (USD)",
  priceHint: "Cena z orákula Aave, kterou najdete na stránce aktiva v aplikaci Aave.",
  threshold: "Likvidační práh (%)",
  thresholdHint: "V E-Mode práh dané kategorie. Na Aave V4 collateral factor.",
  removeCollateral: index => `Odebrat kolaterál ${index}`,
  addCollateral: "Přidat druhý kolaterál",
  debtLegend: "Dluh",
  debtKindLegend: "Co jste si vypůjčili?",
  debtKinds: { stable: "Stablecoin (počítá se za $1.00)", volatile: "Volatilní aktivum, například WETH" },
  debtAmount: { stable: "Vypůjčená částka (USD)", volatile: "Vypůjčené množství (tokeny)" },
  debtAmountHint: "Včetně dosud naběhlého úroku.",
  debtPrice: "Cena vypůjčeného aktiva (USD)",
  errors: {
    number: "Zadejte číslo, například 10 nebo 0.25. Desetinná místa oddělte tečkou.",
    price: "Zadejte cenu vyšší než 0.",
    threshold: "Zadejte procento vyšší než 0 a nejvýše 100.",
    samePrice: (name, price) =>
      `${name} už je výše zadané za ${price}. Použijte stejnou cenu: jedno aktivum má jednu cenu.`,
  },
  eModeLead: "Bez výsledku: Aave tuto kombinaci nedovoluje.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("cs", borrowable);
    const loanText = loan.kind === "stable" ? "s vypůjčeným stablecoinem" : `s vypůjčeným ${loan.name}`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `E-Mode „${category}“ na trhu ${market} dovoluje půjčit si jen ${borrowableList}, takže účet ${loanText} ` +
      `nemůže použít jeho práh ${thresholdPercent}%. Zvolte místo toho vlastní práh kolaterálu${own}, nebo si půjčte ${borrowableList}.`
    );
  },
  results: {
    heading: "Výsledek",
    empty: "Pro výsledek zadejte číslo do každého pole.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Health factor",
    noDebt: "Žádný dluh, takže není co likvidovat.",
    liquidatableNow: "Pod 1.00: pozici lze zlikvidovat už teď.",
    liquidatableBelow: "Pozici lze zlikvidovat pod 1.00.",
    none: "Žádná",
    priceTitle: name => `Likvidační cena ${name}`,
    priceTitleBorrowed: name => `Likvidační cena ${name} (vypůjčeno)`,
    priceTitleShared: name => `Likvidační cena ${name} (vloženo i vypůjčeno)`,
    recover: ({ name, change, now, rises, alike }) =>
      `Health factor se vrátí na 1.00, pokud cena ${name}${alike ? " (vloženého i vypůjčeného)" : ""} ${
        rises ? "vzroste" : "klesne"
      } o ${change} z ${now} a ostatní ceny se nezmění.`,
    collateralFall: ({ change, now }) => `O ${change} pod ${now}, pokud všechny ostatní ceny zůstanou stejné.`,
    collateralNone: name =>
      `Ani při ceně $0 samotné ${name} nesrazí health factor pod 1.00: dluh pokryje ostatní kolaterál.`,
    debtRise: ({ change, now }) =>
      `O ${change} nad ${now}: vypůjčená aktiva tlačí health factor dolů, když jejich cena roste.`,
    sharedRise: ({ name, change, now }) =>
      `O ${change} nad ${now}: vypůjčili jste si víc ${name}, než kolik se započítá z vašeho kolaterálu ${name}, takže růst ceny tlačí health factor dolů. Ostatní ceny se nemění.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `O ${change} pod ${now}, při stejné ceně vypůjčeného ${name} a beze změny všech ostatních cen.`,
    sharedFallRows: ({ name, change, now }) =>
      `O ${change} pod ${now} pro každý řádek ${name}, pokud všechny ostatní ceny zůstanou stejné.`,
    bothSidesNeutral: name =>
      `${name} je zároveň vaším kolaterálem i dluhem, takže se obojí hýbe spolu a jeho cena health factor nemění. Úrok, změna prahu nebo vaše vlastní transakce ho ale změnit mohou.`,
    bothSidesRecover: name =>
      `${name} je na obou stranách, takže se obojí hýbe spolu: žádná cena ${name} sama nevrátí health factor na 1.00.`,
    bothSidesSafe: name =>
      `${name} je na obou stranách, takže se obojí hýbe spolu: jeho cena sama nesrazí health factor pod 1.00.`,
    uniformTitle: "Celý kolaterál klesne najednou",
    uniformDescription: prices =>
      `Pokud cena každého kolaterálu klesne o tolik a cena dluhu se nezmění, health factor dosáhne 1.00: ${prices
        .map(({ name, price }) => `${name} za ${price}`)
        .join(" a ")}.`,
    ratioTitle: (numerator, denominator) => `Poměr cen ${numerator} ÷ ${denominator} při likvidaci`,
    ratioDescription: (now, change, falls) =>
      `Teď ${now}. Pokud se pohnou obě ceny, ${falls ? "pokles" : "růst"} tohoto poměru o ${change} dostane health factor na 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Kolaterál ${collateral}, započtený podle likvidačních prahů: ${weighted}. Health factor = ${weighted} ÷ ${debt} dluhu = ${healthFactor}.`,
  },
  noscript:
    "Kalkulačka potřebuje k přepočítání JavaScript. Výsledek výše platí pro 10 WETH za $2,400 (likvidační práh 83%) proti dluhu 12\u00a0000 USDC. Propočítané příklady na této stránce používají stejný vzorec.",
  disclaimer: {
    lead: "Vzdělávací odhad, nikoli finanční poradenství.",
    beforeDate:
      "Vychází jen z čísel, která zadáte. Živé parametry Aave se mohou měnit: prahy výše byly načteny z blockchainu",
    afterDate:
      " a governance nebo Risk Stewards je mohou kdykoli změnit. Ceny z orákula se hýbou, k dluhu stále přibývá úrok a každá likvidační cena předpokládá, že ostatní ceny zůstanou stejné. Než začnete jednat, zkontrolujte svou pozici v aplikaci Aave.",
  },
};
