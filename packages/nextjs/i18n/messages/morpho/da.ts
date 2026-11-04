import type { MorphoMessages } from "./shared";
import { daForMarket, daOnMarket, plural } from "~~/i18n/format";

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Health factor-alarmer for Morpho Blue og Midnight",
    metaDescription: (networkCount, channels) =>
      `Health factor-alarmer for lån på Morpho Blue og Midnight via ${channels}, på ${networkCount} netværk, med påmindelser før forfaldsdatoen.`,
    title: "Morpho Blue og Midnight: positioner og health factor-alarmer",
    intro: networks =>
      `Dine lånepositioner i de markeder, som Morpho-appen viser, på ${networks}: lån med variabel rente (Morpho Blue) og lån med fast rente (Morpho Midnight). Health factor læses fra kæden.`,
    checks: minutes =>
      `Alarmerne tjekkes ${plural("da", minutes, { one: "hvert minut", other: `hvert ${minutes}. minut` })}. Et lån med fast rente får også en påmindelse 7 dage og 1 dag før forfaldsdatoen og efter forfaldsdatoen en alarm ved hvert tjek, så længe der er gæld tilbage.`,
    access: "Én betaling for adgang dækker dine alarmer for Aave og Morpho.",
    notAffiliated: "Tokenping er ikke tilknyttet Morpho.",
    guideHealthFactor: "Sådan fungerer health factor på Morpho",
    guideLiquidation: "Sådan fungerer likvidation på Morpho",
    guideMidnight: "Lån med fast rente på Morpho Midnight",
    aaveDashboard: "Låner du på Aave? Åbn oversigten for Aave",
  },
  positionsHeading: "Dine positioner på Morpho",
  gate: {
    title: "Forbind en wallet for at fortsætte",
    description:
      "Tokenping skal bruge din wallet-adresse for at finde dine positioner på Morpho. At forbinde flytter ingen midler og koster intet gebyr.",
    connect: "Forbind wallet",
    connecting: "Forbinder",
    approveInWallet: "Godkend forbindelsen i din wallet.",
  },
  list: {
    heading: "Markeder",
    count: count => `${count} med gæld`,
    none: "Der blev ikke fundet lån i de markeder, som Morpho-appen viser.",
    discoveryFailed: "Morphos API svarede ikke, så kun markederne med en gemt alarm vises.",
    variableRate: "Variabel rente",
    fixedRate: "Fast rente",
    matures: date => `Forfalder ${date}`,
    matured: "Forfaldsdatoen er passeret",
    unreadable: "Kunne ikke læses",
    retry: market => `Læs ${market} igen`,
    noneSelectedDescription: "Vælg et marked for at se positionen på Morpho.",
  },
  details: {
    collateralValue: "Sikkerhedens værdi",
    debt: "Gæld",
    ltv: "LTV",
    lltv: "Likvidations-LTV",
    maturity: "Forfaldsdato",
    timeLeft: (days, hours) =>
      days > 0
        ? plural("da", days, { one: "om 1 dag", other: `om ${days} dage` })
        : plural("da", hours, { one: "om 1 time", other: `om ${hours} timer` }),
    pastMaturity:
      "Lånets forfaldsdato er passeret: gæld, der er tilbage, kan blive likvideret når som helst, uanset health factor. Tilbagebetal den for at undgå likvidation.",
    preLiquidation: "Forlikvidation",
    preLiquidationNote:
      "Du har valgt forlikvidation (pre-liquidation) på dette marked, så health factor måles mod dets tidligere grænse: under 1 kan en del af din position blive solgt.",
    amountsIn: token => `Beløbene er i ${token}, værdiansat af markedets orakel.`,
    noDebtTitle: "Ingen gæld i dette marked",
    noDebtDetail: "En gemt alarm forbliver gemt og sender ikke noget, så længe der ikke er nogen gæld.",
    unreadableTitle: "Positionen kunne ikke læses",
    unreadableDetail: "Netværket svarede ikke. Din alarm bliver fortsat tjekket.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Betal én gang for at opsætte health factor-alarmer ${daOnMarket(marketName, "market")} og på andre markeder. Intet fornyes automatisk: du betaler fra din wallet, når du vil forlænge.`,
    descriptionExtend: marketName =>
      `Dine gemte alarmindstillinger ${daForMarket(marketName, "market")} findes stadig på din konto. Betal igen for at forlænge adgangen og redigere dem.`,
  },
};
