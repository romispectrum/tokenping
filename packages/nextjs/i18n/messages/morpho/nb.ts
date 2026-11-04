import type { MorphoMessages } from "./shared";
import { nbForMarket, nbOnMarket, plural } from "~~/i18n/format";

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Health factor-varsler for Morpho Blue og Midnight",
    metaDescription: (networkCount, channels) =>
      `Health factor-varsler for lån på Morpho Blue og Midnight via ${channels}, på ${networkCount} nettverk, med påminnelser før forfallsdatoen.`,
    title: "Morpho Blue og Midnight: posisjoner og health factor-varsler",
    intro: networks =>
      `Lånene dine i markedene som Morpho-appen viser, på ${networks}: lån med flytende rente (Morpho Blue) og lån med fast rente (Morpho Midnight). Health factor leses fra kjeden.`,
    checks: minutes =>
      `Varslene sjekkes ${plural("nb", minutes, { one: "hvert minutt", other: `hvert ${minutes}. minutt` })}. Et lån med fast rente får også en påminnelse 7 dager og 1 dag før forfallsdatoen, og etter forfallsdatoen et varsel ved hver sjekk så lenge det er gjeld igjen.`,
    access: "Én betaling for tilgang dekker varslene dine for Aave og Morpho.",
    notAffiliated: "Tokenping er ikke tilknyttet Morpho.",
    guideHealthFactor: "Slik fungerer health factor på Morpho",
    guideLiquidation: "Slik fungerer likvidasjon på Morpho",
    guideMidnight: "Lån med fast rente på Morpho Midnight",
    aaveDashboard: "Låner du på Aave? Åpne oversikten for Aave",
  },
  positionsHeading: "Posisjonene dine på Morpho",
  gate: {
    title: "Koble til en lommebok for å fortsette",
    description:
      "Tokenping trenger lommebokadressen din for å finne posisjonene dine på Morpho. Å koble til flytter ingen midler og koster ikke noe gebyr.",
    connect: "Koble til lommebok",
    connecting: "Kobler til",
    approveInWallet: "Godkjenn tilkoblingen i lommeboken din.",
  },
  list: {
    heading: "Markeder",
    count: count => `${count} med gjeld`,
    none: "Fant ingen lån i markedene som Morpho-appen viser.",
    discoveryFailed: "Morphos API svarte ikke, så bare markedene med et lagret varsel vises.",
    variableRate: "Flytende rente",
    fixedRate: "Fast rente",
    matures: date => `Forfaller ${date}`,
    matured: "Forfallsdatoen er passert",
    unreadable: "Kunne ikke leses",
    retry: market => `Les ${market} på nytt`,
    noneSelectedDescription: "Velg et marked for å se posisjonen på Morpho.",
  },
  details: {
    collateralValue: "Sikkerhetens verdi",
    debt: "Gjeld",
    ltv: "LTV",
    lltv: "Likvidasjons-LTV",
    maturity: "Forfallsdato",
    timeLeft: (days, hours) =>
      days > 0
        ? plural("nb", days, { one: "om 1 dag", other: `om ${days} dager` })
        : plural("nb", hours, { one: "om 1 time", other: `om ${hours} timer` }),
    pastMaturity:
      "Lånets forfallsdato er passert: gjeld som er igjen, kan likvideres når som helst, uansett health factor. Betal den tilbake for å unngå likvidasjon.",
    preLiquidation: "Forhåndslikvidasjon",
    preLiquidationNote:
      "Du har valgt forhåndslikvidasjon (pre-liquidation) på dette markedet, så health factor måles mot den tidligere grensen: under 1 kan en del av posisjonen din selges.",
    amountsIn: token => `Beløpene er i ${token}, verdsatt av markedets orakel.`,
    noDebtTitle: "Ingen gjeld i dette markedet",
    noDebtDetail: "Et lagret varsel forblir lagret og sender ingenting så lenge det ikke er noen gjeld.",
    unreadableTitle: "Posisjonen kunne ikke leses",
    unreadableDetail: "Nettverket svarte ikke. Varselet ditt sjekkes fortsatt.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Betal én gang for å sette opp health factor-varsler ${nbOnMarket(marketName, "market")} og på andre markeder. Ingenting fornyes automatisk: du betaler fra lommeboken din når du vil forlenge.`,
    descriptionExtend: marketName =>
      `De lagrede varselinnstillingene dine ${nbForMarket(marketName, "market")} ligger fortsatt i kontoen din. Betal igjen for å forlenge tilgangen og redigere dem.`,
  },
};
