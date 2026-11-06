import type { MorphoMessages } from "./shared";
import { huOnMarket, plural } from "~~/i18n/format";

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Morpho health factor-riasztások Blue és Midnight hitelekhez",
    metaDescription: (networkCount, channels) =>
      `Morpho Blue és Midnight health factor-riasztások (${channels}) ${networkCount} hálózaton, emlékeztetővel a fix kamatozású hitelek lejárata előtt.`,
    title: "Morpho Blue és Midnight pozíciók és health factor-riasztások",
    intro: networks =>
      `A hitelpozícióid a Morpho alkalmazásban listázott piacokon, a következő hálózatokon: ${networks}. Változó kamatozású hitelek (Morpho Blue) és fix kamatozású hitelek (Morpho Midnight). A health factort a láncról olvassuk ki.`,
    checks: (minutes, repeatMinutes) =>
      `A riasztásokat ${minutes} percenként ellenőrizzük. Egy fix kamatozású hitelhez a lejárat előtt 7 nappal és 1 nappal emlékeztető is jár, a lejárat után pedig ${repeatMinutes} percenként riasztás, amíg adósság marad.`,
    access: "Egyetlen hozzáférési díj fedezi az Aave- és a Morpho-riasztásaidat is.",
    notAffiliated: "A Tokenping nem kapcsolódik a Morphóhoz.",
    guideHealthFactor: "Hogyan működik a Morpho health factor",
    guideLiquidation: "Hogyan működik a likvidálás a Morphón",
    guideMidnight: "Morpho Midnight fix kamatozású hitelek",
    aaveDashboard: "Az Aave-on veszel fel hitelt? Nyisd meg az Aave irányítópultot",
  },
  positionsHeading: "A Morpho-pozícióid",
  gate: {
    title: "A folytatáshoz csatlakoztass egy tárcát",
    description:
      "A Morpho-pozícióid megkereséséhez a Tokenpingnek szüksége van a tárcacímedre. A csatlakoztatás nem mozgat pénzt, és nem kerül díjba.",
    connect: "Tárca csatlakoztatása",
    connecting: "Csatlakozás",
    approveInWallet: "Hagyd jóvá a csatlakozást a tárcádban.",
  },
  list: {
    heading: "Piacok",
    count: count => `${count} adóssággal`,
    none: "A Morpho alkalmazásban listázott piacokon nem találtunk hitelfelvételt.",
    discoveryFailed: "A Morpho API nem válaszolt, ezért csak a mentett riasztással rendelkező piacokat listázzuk.",
    variableRate: "Változó kamat",
    fixedRate: "Fix kamat",
    matures: date => `Lejárat: ${date}`,
    matured: "Lejárt",
    unreadable: "Nem sikerült kiolvasni",
    retry: market => `Újraolvasás: ${market}`,
    noneSelectedDescription: "Válassz egy piacot a Morpho-pozíciója megtekintéséhez.",
  },
  details: {
    collateralValue: "A fedezet értéke",
    debt: "Adósság",
    ltv: "LTV",
    lltv: "Likvidálási LTV",
    maturity: "Lejárat",
    // Hungarian keeps the noun singular after a number, so both forms read the same.
    timeLeft: (days, hours) =>
      days > 0
        ? plural("hu", days, { one: `${days} nap múlva`, other: `${days} nap múlva` })
        : plural("hu", hours, { one: `${hours} óra múlva`, other: `${hours} óra múlva` }),
    pastMaturity:
      "Ez a hitel lejárt: a megmaradt adósság bármikor likvidálható, a health factortól függetlenül. A likvidálás elkerüléséhez fizesd vissza.",
    preLiquidation: "Előlikvidálás",
    preLiquidationNote:
      "Ezen a piacon bekapcsoltad az előlikvidálást, ezért a health factor egy korábbi határhoz mérődik: 1 alatt a pozíciód egy része eladható.",
    amountsIn: token => `Az összegek ${token} tokenben értendők, a piac orákuluma szerinti értéken.`,
    noDebtTitle: "Ezen a piacon nincs adósság",
    noDebtDetail: "A mentett riasztás mentve marad, és nem küld semmit, amíg nincs adósság.",
    unreadableTitle: "Ezt a pozíciót nem sikerült kiolvasni",
    unreadableDetail: "A hálózat nem válaszolt. A riasztásodat továbbra is ellenőrizzük.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Fizess egyszer, és beállíthatsz health factor-riasztásokat ${huOnMarket(marketName, "market")} és más piacokon. Semmi sem újul meg automatikusan: a tárcádból fizetsz, amikor hosszabbítani szeretnél.`,
    descriptionExtend: marketName =>
      `A riasztási beállításaid ${huOnMarket(marketName, "market")} továbbra is el vannak mentve a fiókodban. Fizess újra, hogy meghosszabbítsd a hozzáférést és szerkeszthesd őket.`,
  },
};
