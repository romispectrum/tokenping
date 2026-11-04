import type { CalculatorMessages } from "./shared";
import { capitalize, huArticle, huOnMarket, joinList } from "~~/i18n/format";

// The calculator reads and shows numbers the app's way (a decimal point, "$2,400.00"), so the examples, hints and
// results keep the decimal point and group thousands with a space, which reads the same either way. A number is
// followed by a noun ("1.00 értékre", "$0 áron") and an asset's name by a noun or a colon ("a WETH ára",
// "Likvidálási ár: WETH"), so no suffix has to agree with how a number or a name is read.

/** "a WETH", "az USDC": the article an asset's name takes. */
const the = (name: string) => `${huArticle(name)} ${name}`;

export const MESSAGES: CalculatorMessages = {
  title: "Aave likvidálásiár-kalkulátor",
  intro:
    "Add meg az összes fedezeti eszközt és az adósságodat, és megkapod a health factort, valamint azokat az árakat, amelyeken a pozíció likvidálható. A kalkulátor az Aave V3 képletét használja: Σ(fedezet értéke × likvidálási küszöb) ÷ adósság értéke.",
  examplesLabel: "Kidolgozott példa betöltése:",
  examples: {
    "one-collateral": "10 WETH, 12 000 USDC adósság",
    "two-collaterals": "10 WETH + 0.2 WBTC, 20 000 USDC adósság",
    "volatile-debt": "10 000 USDC, 2.5 WETH felvéve",
  },
  defaultCollateralName: index => `Fedezet ${index}`,
  defaultDebtName: "Felvett eszköz",
  collateralLegend: index => `${index}. fedezet`,
  presetLabel: "Aave V3-eszköz (kitölti a küszöböt)",
  eModeHint: (collateral, borrowable) =>
    `Ez a küszöb a következőkre érvényes: ${joinList("hu", collateral)}. A többi fedezetre a saját küszöbe vonatkozik. Ebben az E-Mode-kategóriában csak ezeket veheted fel: ${joinList("hu", borrowable)}.`,
  otherAsset: "Más eszköz: a küszöböt te adod meg",
  presetGroup: (market, date) => `${market} (leolvasva: ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode „ETH correlated” (pl. WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (natív)",
  },
  nameLabel: "Eszköz neve",
  namePlaceholder: symbols => `pl. ${joinList("hu", symbols, "disjunction")}`,
  amountSupplied: "Elhelyezett mennyiség",
  price: "Ár (USD)",
  priceHint: "Az Aave orákulumára, amelyet az Aave alkalmazásban az eszköz oldalán látsz.",
  threshold: "Likvidálási küszöb (%)",
  thresholdHint: "E-Mode-ban a kategória küszöbe. Aave V4-en a collateral factor.",
  removeCollateral: index => `${index}. fedezet eltávolítása`,
  addCollateral: "Második fedezet hozzáadása",
  debtLegend: "Adósság",
  debtKindLegend: "Mit vettél fel?",
  debtKinds: {
    stable: "Stablecoint ($1.00 értéken számolva)",
    volatile: "Árfolyamkockázatos eszközt, például WETH-et",
  },
  debtAmount: { stable: "Felvett összeg (USD)", volatile: "Felvett mennyiség (token)" },
  debtAmountHint: "Számold bele az eddig felgyűlt kamatot is.",
  debtPrice: "A felvett eszköz ára (USD)",
  errors: {
    number: "Adj meg egy számot, például 10 vagy 0.25, tizedesjelként ponttal.",
    price: "Adj meg 0-nál nagyobb árat.",
    threshold: "Adj meg 0-nál nagyobb és legfeljebb 100 százalékot.",
    samePrice: (name, price) =>
      `${capitalize(the(name))} már szerepel fentebb, ${price} áron. Használd ugyanazt az árat: egy eszköznek egy ára van.`,
  },
  eModeLead: "Nincs eredmény: az Aave nem engedi ezt a kombinációt.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("hu", borrowable);
    const loanText = loan.kind === "stable" ? "stablecoint vett fel" : `${loan.name} tokent vett fel`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `${capitalize(huOnMarket(market, "market"))} ${huArticle(category)} „${category}” E-Mode-kategória csak ezek felvételét engedi: ${borrowableList}. ` +
      `Ezért az a fiók, amely ${loanText}, nem használhatja a kategória ${thresholdPercent}%-os küszöbét. Válaszd helyette a fedezet saját küszöbét${own}, vagy vegyél fel ezek közül: ${borrowableList}.`
    );
  },
  results: {
    heading: "Eredmény",
    empty: "Az eredményhez írj be egy számot minden mezőbe.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Health factor",
    noDebt: "Nincs adósság, így nincs mit likvidálni.",
    liquidatableNow: "1.00 alatt: a pozíció most likvidálható.",
    liquidatableBelow: "A pozíció 1.00 alatt likvidálható.",
    none: "Nincs",
    priceTitle: name => `Likvidálási ár: ${name}`,
    priceTitleBorrowed: name => `Likvidálási ár: ${name} (felvett)`,
    priceTitleShared: name => `Likvidálási ár: ${name} (elhelyezett és felvett)`,
    recover: ({ name, change, now, rises, alike }) =>
      `A health factor ismét eléri az 1.00 értéket, ha ${the(name)} ára${alike ? " (elhelyezve és felvéve egyaránt)" : ""} a mostani ${now} értékről ${change} mértékben ${
        rises ? "emelkedik" : "csökken"
      }, és a többi ár nem változik.`,
    collateralFall: ({ change, now }) =>
      `A mostani ${now} árnál ${change} mértékben alacsonyabb, ha minden más ár változatlan marad.`,
    collateralNone: name =>
      `${capitalize(the(name))} még $0 áron sem tudja egyedül 1.00 alá vinni a health factort: a többi fedezet fedezi az adósságot.`,
    debtRise: ({ change, now }) =>
      `A mostani ${now} árnál ${change} mértékben magasabb: ha a felvett eszközök drágulnak, a health factor csökken.`,
    sharedRise: ({ name, change, now }) =>
      `A mostani ${now} árnál ${change} mértékben magasabb: több ${name} tokent vettél fel, mint amennyit ${the(name)}-fedezetedből a számítás beszámít, ezért az emelkedés csökkenti a health factort. A többi ár változatlan.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `A mostani ${now} árnál ${change} mértékben alacsonyabb, ha a felvett ${name} ára ugyanez, és minden más ár változatlan.`,
    sharedFallRows: ({ name, change, now }) =>
      `A mostani ${now} árnál ${change} mértékben alacsonyabb minden ${name}-sorban, ha minden más ár változatlan marad.`,
    bothSidesNeutral: name =>
      `${capitalize(the(name))} egyszerre a fedezeted és az adósságod, így a kettő együtt mozog, és az ára nem változtat a health factoron. A kamat, egy küszöbváltozás vagy a saját tranzakcióid viszont igen.`,
    bothSidesRecover: name =>
      `${capitalize(the(name))} mindkét oldalon szerepel, így a kettő együtt mozog: önmagában egyetlen ${name}-ár sem hozza vissza a health factort 1.00 értékre.`,
    bothSidesSafe: name =>
      `${capitalize(the(name))} mindkét oldalon szerepel, így a kettő együtt mozog: az ára önmagában nem tudja 1.00 alá vinni a health factort.`,
    uniformTitle: "Minden fedezet együtt esik",
    uniformDescription: prices =>
      `Ha minden fedezet ára ennyit esik, és az adósság ára nem mozdul, a health factor eléri az 1.00 értéket: ${joinList(
        "hu",
        prices.map(({ name, price }) => `${name}: ${price}`),
      )}.`,
    ratioTitle: (numerator, denominator) => `${numerator} ÷ ${denominator} árarány likvidáláskor`,
    ratioDescription: (now, change, falls) =>
      `Jelenleg ${now}. Ha mindkét ár mozog, ennek az aránynak ${change} mértékű ${falls ? "csökkenése" : "emelkedése"} 1.00 értékre viszi a health factort.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Fedezet: ${collateral}, a likvidálási küszöbökkel számolva: ${weighted}. Health factor = ${weighted} ÷ ${debt} adósság = ${healthFactor}.`,
  },
  noscript:
    "Az újraszámoláshoz a kalkulátornak JavaScript kell. A fenti eredmény 10 WETH-re vonatkozik $2 400 áron (likvidálási küszöb 83%), 12 000 USDC adóssággal szemben. Az oldal kidolgozott példái ugyanezt a képletet használják.",
  disclaimer: {
    lead: "Oktatási célú becslés, nem pénzügyi tanácsadás.",
    beforeDate:
      "Csak az általad megadott számokkal számol. Az Aave élő paraméterei változhatnak: a fenti küszöböket a láncról olvastuk le, ekkor:",
    afterDate:
      " A governance vagy a Risk Stewards bármikor módosíthatja őket. Az orákulumárak mozognak, a kamat folyamatosan növeli az adósságodat, és minden likvidálási ár azzal számol, hogy minden más ár változatlan marad. Mielőtt lépnél, ellenőrizd a pozíciódat az Aave alkalmazásban.",
  },
};
