import type { MorphoMessages } from "./shared";
import { deForMarket, deOnMarket, plural } from "~~/i18n/format";

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Morpho Health-Factor-Alerts für Blue- und Midnight-Kredite",
    metaDescription: (networkCount, channels) =>
      `Health-Factor-Alerts für Morpho Blue und Midnight (Festzins) per ${channels}, in ${networkCount} Netzwerken, mit Erinnerung vor der Fälligkeit.`,
    title: "Morpho Blue und Midnight: Positionen und Health-Factor-Alerts",
    intro: networks =>
      `Deine Kreditpositionen in den Märkten, die die Morpho-App listet, auf ${networks}: Kredite mit variablem Zinssatz (Morpho Blue) und mit festem Zinssatz (Morpho Midnight). Die Health Factors werden direkt aus der Blockchain gelesen.`,
    checks: (minutes, repeatMinutes) =>
      `Alerts werden ${plural("de", minutes, { one: "jede Minute", other: `alle ${minutes} Minuten` })} geprüft. Ein Kredit mit festem Zinssatz bekommt außerdem 7 Tage und 1 Tag vor der Fälligkeit eine Erinnerung und nach der Fälligkeit alle ${repeatMinutes} Minuten einen Alert, solange Schulden offen sind.`,
    access: "Eine Zahlung für den Zugang deckt deine Alerts für Aave und Morpho ab.",
    notAffiliated: "Tokenping ist nicht mit Morpho verbunden.",
    guideHealthFactor: "So funktioniert der Health Factor bei Morpho",
    guideLiquidation: "So funktioniert die Liquidation bei Morpho",
    guideMidnight: "Festzinskredite bei Morpho Midnight",
    aaveDashboard: "Du leihst auf Aave? Öffne das Aave-Dashboard",
  },
  positionsHeading: "Deine Morpho-Positionen",
  gate: {
    title: "Verbinde eine Wallet, um fortzufahren",
    description:
      "Tokenping braucht deine Wallet-Adresse, um deine Morpho-Positionen zu finden. Das Verbinden bewegt kein Guthaben und kostet keine Gebühr.",
    connect: "Wallet verbinden",
    connecting: "Wird verbunden",
    approveInWallet: "Bestätige die Verbindung in deiner Wallet.",
  },
  list: {
    heading: "Märkte",
    count: count => `${count} mit Schulden`,
    none: "In den Märkten, die die Morpho-App listet, wurde kein Kredit gefunden.",
    discoveryFailed:
      "Die API von Morpho hat nicht geantwortet, daher sind nur die Märkte mit einem gespeicherten Alert aufgeführt.",
    variableRate: "Variabler Zinssatz",
    fixedRate: "Fester Zinssatz",
    matures: date => `Fällig am ${date}`,
    matured: "Fälligkeit überschritten",
    unreadable: "Konnte nicht gelesen werden",
    retry: market => `${market} erneut lesen`,
    noneSelectedDescription: "Wähle einen Markt, um deine Morpho-Position zu sehen.",
  },
  details: {
    collateralValue: "Wert der Sicherheiten",
    debt: "Schulden",
    ltv: "LTV",
    lltv: "Liquidations-LTV",
    maturity: "Fälligkeit",
    timeLeft: (days, hours) =>
      days > 0
        ? plural("de", days, { one: "in 1 Tag", other: `in ${days} Tagen` })
        : plural("de", hours, { one: "in 1 Stunde", other: `in ${hours} Stunden` }),
    pastMaturity:
      "Dieser Kredit hat seine Fälligkeit überschritten: Offene Schulden können jederzeit liquidiert werden, egal wie hoch der Health Factor ist. Zahle sie zurück, um eine Liquidation zu vermeiden.",
    preLiquidation: "Vorliquidation",
    preLiquidationNote:
      "Du hast in diesem Markt die Vorliquidation (pre-liquidation) aktiviert, daher wird der Health Factor an ihrer früheren Grenze gemessen: Unter 1 kann ein Teil deiner Position verkauft werden.",
    amountsIn: token => `Die Beträge sind in ${token} angegeben, bewertet mit dem Orakel des Markts.`,
    noDebtTitle: "Keine Schulden in diesem Markt",
    noDebtDetail: "Ein gespeicherter Alert bleibt gespeichert und sendet nichts, solange keine Schulden bestehen.",
    unreadableTitle: "Diese Position konnte nicht gelesen werden",
    unreadableDetail: "Das Netzwerk hat nicht geantwortet. Dein Alert wird weiter geprüft.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Zahle einmal, um Health-Factor-Alerts ${deOnMarket(marketName, "market")} und in anderen Märkten einzurichten. Nichts verlängert sich automatisch: Wenn du verlängern willst, zahlst du aus deiner Wallet.`,
    descriptionExtend: marketName =>
      `Deine gespeicherten Alert-Einstellungen ${deForMarket(marketName, "market")} sind noch in deinem Konto. Zahle erneut, um den Zugang zu verlängern und sie zu bearbeiten.`,
  },
};
