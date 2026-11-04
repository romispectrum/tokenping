import type { MorphoMessages } from "./shared";
import { nlForMarket, nlOnMarket, plural } from "~~/i18n/format";

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Health factor-alerts voor Morpho Blue en Midnight",
    metaDescription: (networkCount, channels) =>
      `Health factor-alerts voor leningen op Morpho Blue en Midnight via ${channels}, op ${networkCount} netwerken, met herinneringen vóór de vervaldatum.`,
    title: "Morpho Blue en Midnight: posities en health factor-alerts",
    intro: networks =>
      `Je leenposities in de markten die de Morpho-app vermeldt, op ${networks}: leningen met variabele rente (Morpho Blue) en met vaste rente (Morpho Midnight). De health factor wordt van de chain gelezen.`,
    checks: minutes =>
      `Alerts worden ${plural("nl", minutes, { one: "elke minuut", other: `elke ${minutes} minuten` })} gecontroleerd. Een lening met vaste rente krijgt ook een herinnering 7 dagen en 1 dag vóór de vervaldatum, en na de vervaldatum een alert bij elke controle zolang er nog schuld is.`,
    access: "Eén betaling voor toegang dekt je alerts voor Aave en Morpho.",
    notAffiliated: "Tokenping is niet verbonden aan Morpho.",
    guideHealthFactor: "Zo werkt de health factor van Morpho",
    guideLiquidation: "Zo werkt liquidatie bij Morpho",
    guideMidnight: "Leningen met vaste rente op Morpho Midnight",
    aaveDashboard: "Leen je op Aave? Open het Aave-dashboard",
  },
  positionsHeading: "Je Morpho-posities",
  gate: {
    title: "Koppel een wallet om verder te gaan",
    description:
      "Tokenping heeft je walletadres nodig om je Morpho-posities te vinden. Koppelen verplaatst geen geld en kost niets.",
    connect: "Wallet koppelen",
    connecting: "Koppelen",
    approveInWallet: "Keur de koppeling goed in je wallet.",
  },
  list: {
    heading: "Markten",
    count: count => `${count} met schuld`,
    none: "Geen leningen gevonden in de markten die de Morpho-app vermeldt.",
    discoveryFailed: "De API van Morpho gaf geen antwoord, dus alleen de markten met een opgeslagen alert staan erbij.",
    variableRate: "Variabele rente",
    fixedRate: "Vaste rente",
    matures: date => `Vervalt op ${date}`,
    matured: "Vervaldatum voorbij",
    unreadable: "Kon niet worden gelezen",
    retry: market => `${market} opnieuw lezen`,
    noneSelectedDescription: "Kies een markt om de Morpho-positie te zien.",
  },
  details: {
    collateralValue: "Waarde van het onderpand",
    debt: "Schuld",
    ltv: "LTV",
    lltv: "Liquidatie-LTV",
    maturity: "Vervaldatum",
    timeLeft: (days, hours) =>
      days > 0
        ? plural("nl", days, { one: "over 1 dag", other: `over ${days} dagen` })
        : plural("nl", hours, { one: "over 1 uur", other: `over ${hours} uur` }),
    pastMaturity:
      "De vervaldatum van deze lening is voorbij: resterende schuld kan op elk moment worden geliquideerd, wat de health factor ook is. Los hem af om liquidatie te voorkomen.",
    preLiquidation: "Pre-liquidatie",
    preLiquidationNote:
      "Je hebt op deze markt gekozen voor pre-liquidatie, dus de health factor wordt gemeten tegen die eerdere grens: onder 1 kan een deel van je positie worden verkocht.",
    amountsIn: token => `Bedragen zijn in ${token}, gewaardeerd door de oracle van de markt.`,
    noDebtTitle: "Geen schuld in deze markt",
    noDebtDetail: "Een opgeslagen alert blijft bewaard en stuurt niets zolang er geen schuld is.",
    unreadableTitle: "Deze positie kon niet worden gelezen",
    unreadableDetail: "Het netwerk gaf geen antwoord. Je alert wordt gewoon verder gecontroleerd.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Betaal één keer om health factor-alerts in te stellen ${nlOnMarket(marketName, "market")} en in andere markten. Niets wordt automatisch verlengd: je betaalt vanuit je wallet als je wilt verlengen.`,
    descriptionExtend: marketName =>
      `Je bewaarde alertinstellingen ${nlForMarket(marketName, "market")} staan nog in je account. Betaal opnieuw om de toegang te verlengen en ze te bewerken.`,
  },
};
