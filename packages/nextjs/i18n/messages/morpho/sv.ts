import type { MorphoMessages } from "./shared";
import { plural, svForMarket, svOnMarket } from "~~/i18n/format";

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Health factor-larm för Morpho Blue och Midnight",
    metaDescription: (networkCount, channels) =>
      `Health factor-larm för lån på Morpho Blue och Midnight via ${channels}, på ${networkCount} nätverk, med påminnelser före förfallodagen.`,
    title: "Morpho Blue och Midnight: positioner och health factor-larm",
    intro: networks =>
      `Dina lånepositioner i marknaderna som Morpho-appen listar, på ${networks}: lån med rörlig ränta (Morpho Blue) och lån med fast ränta (Morpho Midnight). Health factor läses från kedjan.`,
    checks: (minutes, repeatMinutes) =>
      `Larmen kontrolleras ${plural("sv", minutes, { one: "en gång i minuten", other: `var ${minutes} minuter` })}. Ett lån med fast ränta får också en påminnelse 7 dagar och 1 dag före förfallodagen, och efter förfallodagen ett larm var ${repeatMinutes}:e minut så länge det finns skuld kvar.`,
    access: "En betalning för åtkomst täcker dina larm för Aave och Morpho.",
    notAffiliated: "Tokenping är inte knutet till Morpho.",
    guideHealthFactor: "Så fungerar health factor på Morpho",
    guideLiquidation: "Så fungerar likvidation på Morpho",
    guideMidnight: "Lån med fast ränta på Morpho Midnight",
    aaveDashboard: "Lånar du på Aave? Öppna översikten för Aave",
  },
  positionsHeading: "Dina positioner på Morpho",
  gate: {
    title: "Anslut en plånbok för att fortsätta",
    description:
      "Tokenping behöver din plånboksadress för att hitta dina positioner på Morpho. Att ansluta flyttar inga pengar och kostar ingen avgift.",
    connect: "Anslut plånbok",
    connecting: "Ansluter",
    approveInWallet: "Godkänn anslutningen i din plånbok.",
  },
  list: {
    heading: "Marknader",
    count: count => `${count} med skuld`,
    none: "Inga lån hittades i marknaderna som Morpho-appen listar.",
    discoveryFailed: "Morphos API svarade inte, så bara marknaderna med ett sparat larm visas.",
    variableRate: "Rörlig ränta",
    fixedRate: "Fast ränta",
    matures: date => `Förfaller ${date}`,
    matured: "Förfallodagen har passerat",
    unreadable: "Kunde inte läsas",
    retry: market => `Läs ${market} igen`,
    noneSelectedDescription: "Välj en marknad för att se positionen på Morpho.",
  },
  details: {
    collateralValue: "Säkerhetens värde",
    debt: "Skuld",
    ltv: "LTV",
    lltv: "Likvidations-LTV",
    maturity: "Förfallodag",
    timeLeft: (days, hours) =>
      days > 0
        ? plural("sv", days, { one: "om 1 dag", other: `om ${days} dagar` })
        : plural("sv", hours, { one: "om 1 timme", other: `om ${hours} timmar` }),
    pastMaturity:
      "Lånets förfallodag har passerat: skuld som finns kvar kan likvideras när som helst, oavsett health factor. Betala tillbaka den för att undvika likvidation.",
    preLiquidation: "Förlikvidation",
    preLiquidationNote:
      "Du har valt förlikvidation (pre-liquidation) på den här marknaden, så health factor mäts mot dess tidigare gräns: under 1 kan en del av din position säljas.",
    amountsIn: token => `Beloppen är i ${token}, värderade av marknadens orakel.`,
    noDebtTitle: "Ingen skuld i den här marknaden",
    noDebtDetail: "Ett sparat larm förblir sparat och skickar ingenting så länge det inte finns någon skuld.",
    unreadableTitle: "Positionen kunde inte läsas",
    unreadableDetail: "Nätverket svarade inte. Ditt larm fortsätter att kontrolleras.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Betala en gång för att ställa in health factor-larm ${svOnMarket(marketName, "market")} och på andra marknader. Inget förnyas automatiskt: du betalar från din plånbok när du vill förlänga.`,
    descriptionExtend: marketName =>
      `Dina sparade larminställningar ${svForMarket(marketName, "market")} finns kvar i ditt konto. Betala igen för att förlänga åtkomsten och redigera dem.`,
  },
};
