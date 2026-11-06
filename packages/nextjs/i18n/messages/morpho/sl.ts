import type { MorphoMessages } from "./shared";
import { plural, slForMarket, slOnMarket } from "~~/i18n/format";

/** "vsako minuto", "vsaki 2 minuti", "vsake 3 minute", "vsakih 5 minut". */
const everyMinutes = (minutes: number) =>
  plural("sl", minutes, {
    one: minutes === 1 ? "vsako minuto" : `vsako ${minutes} minuto`,
    two: `vsaki ${minutes} minuti`,
    few: `vsake ${minutes} minute`,
    other: `vsakih ${minutes} minut`,
  });

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Opozorila za health factor v Morpho Blue in Midnight",
    metaDescription: (networkCount, channels) =>
      `Opozorila za health factor pri posojilih v Morpho Blue in Midnight ${plural("sl", networkCount, { one: `na ${networkCount} omrežju`, other: `na ${networkCount} omrežjih` })}, z opomnikom pred zapadlostjo. Kanali: ${channels}.`,
    title: "Pozicije v Morpho Blue in Midnight ter opozorila za health factor",
    intro: networks =>
      `Tvoje pozicije izposoje na trgih, ki jih navaja aplikacija Morpho, na omrežjih ${networks}: posojila s spremenljivo obrestno mero (Morpho Blue) in posojila s fiksno obrestno mero (Morpho Midnight). Health factor se bere z verige.`,
    checks: (minutes, repeatMinutes) =>
      `Opozorila se preverjajo ${everyMinutes(minutes)}. Posojilo s fiksno obrestno mero dobi tudi opomnik 7 dni in 1 dan pred zapadlostjo, po zapadlosti pa opozorilo vsakih ${repeatMinutes} minut, dokler ostaja dolg.`,
    access: "Eno plačilo za dostop pokrije tvoja opozorila za Aave in Morpho.",
    notAffiliated: "Tokenping ni povezan z Morpho.",
    guideHealthFactor: "Kako deluje health factor v Morpho",
    guideLiquidation: "Kako poteka likvidacija v Morpho",
    guideMidnight: "Posojila s fiksno obrestno mero v Morpho Midnight",
    aaveDashboard: "Si izposojaš v Aave? Odpri nadzorno ploščo Aave",
  },
  positionsHeading: "Tvoje pozicije v Morpho",
  gate: {
    title: "Za nadaljevanje poveži denarnico",
    description:
      "Tokenping potrebuje naslov tvoje denarnice, da najde tvoje pozicije v Morpho. Povezava ne premika sredstev in ne stane ničesar.",
    connect: "Poveži denarnico",
    connecting: "Povezovanje",
    approveInWallet: "Odobri povezavo v denarnici.",
  },
  list: {
    heading: "Trgi",
    count: count => `Z dolgom: ${count}`,
    none: "Na trgih, ki jih navaja aplikacija Morpho, ni najdenih posojil.",
    discoveryFailed: "API Morpho se ni odzval, zato so prikazani samo trgi s shranjenim opozorilom.",
    variableRate: "Spremenljiva obrestna mera",
    fixedRate: "Fiksna obrestna mera",
    matures: date => `Zapade ${date}`,
    matured: "Po zapadlosti",
    unreadable: "Ni bilo mogoče prebrati",
    retry: market => `Znova preberi trg ${market}`,
    noneSelectedDescription: "Izberi trg, da vidiš svojo pozicijo v Morpho.",
  },
  details: {
    collateralValue: "Vrednost zavarovanja",
    debt: "Dolg",
    ltv: "LTV",
    lltv: "Likvidacijski LTV",
    maturity: "Zapadlost",
    timeLeft: (days, hours) =>
      days > 0
        ? plural("sl", days, {
            one: `čez ${days} dan`,
            two: `čez ${days} dneva`,
            few: `čez ${days} dni`,
            other: `čez ${days} dni`,
          })
        : plural("sl", hours, {
            one: `čez ${hours} uro`,
            two: `čez ${hours} uri`,
            few: `čez ${hours} ure`,
            other: `čez ${hours} ur`,
          }),
    pastMaturity:
      "To posojilo je po zapadlosti: preostali dolg je mogoče likvidirati kadar koli, ne glede na health factor. Odplačaj ga, da se izogneš likvidaciji.",
    preLiquidation: "Predlikvidacija",
    preLiquidationNote:
      "Na tem trgu imaš vklopljeno predlikvidacijo (pre-liquidation), zato se health factor meri glede na njen zgodnejši prag: pod 1 je mogoče prodati del tvoje pozicije.",
    amountsIn: token => `Zneski so v žetonu ${token}, ovrednoteni z orakljem trga.`,
    noDebtTitle: "Na tem trgu ni dolga",
    noDebtDetail: "Shranjeno opozorilo ostane shranjeno in ne pošilja ničesar, dokler ni dolga.",
    unreadableTitle: "Te pozicije ni bilo mogoče prebrati",
    unreadableDetail: "Omrežje se ni odzvalo. Tvoje opozorilo se še naprej preverja.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Plačaj enkrat, da nastaviš opozorila za health factor ${slOnMarket(marketName, "market")} in na drugih trgih. Nič se ne podaljša samodejno: ko želiš podaljšati, plačaš iz svoje denarnice.`,
    descriptionExtend: marketName =>
      `Tvoje shranjene nastavitve opozoril ${slForMarket(marketName, "market")} so še vedno v tvojem računu. Plačaj znova, da podaljšaš dostop in jih urejaš.`,
  },
};
