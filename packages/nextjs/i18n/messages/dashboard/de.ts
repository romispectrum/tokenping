import type { DashboardMessages } from "./shared";
import { deForMarket, deOnMarket, plural } from "~~/i18n/format";

export const MESSAGES: DashboardMessages = {
  page: {
    metaTitle: "Aave V3 und V4: Positionen und Health Factor",
    metaDescription: (networkCount, channels) =>
      `Sieh Sicherheiten, Schulden und Health Factor auf Aave V3 und V4 in ${networkCount} Netzwerken. Alerts per ${channels}, je Markt ein Schwellenwert.`,
    title: "Aave V3 und V4: Positionen und Health-Factor-Alerts",
    networkMarkets: (name, markets) => `${name} (Märkte ${markets})`,
    intro: (v3Networks, v4Networks) =>
      `Verbinde die Wallet, mit der du leihst, um ihre Sicherheiten, Schulden und ihren Health Factor auf Aave V3 auf ${v3Networks} und in jedem Spoke von Aave V4 auf ${v4Networks} zu sehen. Zum Ansehen ist keine Transaktion nötig.`,
    disclosureSummary: "Was Alerts kosten und wie oft wir prüfen",
    alertsCost: (channels, paymentChain) =>
      `Um eine Nachricht per ${channels} zu bekommen, wenn der Health Factor eines Markts unter einen Schwellenwert fällt, den du wählst, schalte die Alerts mit einer USDC-Zahlung${paymentChain ? ` auf ${paymentChain}` : ""} frei. Der aktuelle Preis wird vor dem Bezahlen angezeigt.`,
    checks: minutes =>
      `Tokenping prüft ${plural("de", minutes, { one: "jede Minute", other: `alle ${minutes} Minuten` })}. Solange der Health Factor unter deinem Schwellenwert bleibt, sendet jede Prüfung eine weitere Nachricht über jeden Kanal, den du gewählt hast.`,
    guideThreshold: "So wählst du einen Schwellenwert",
    guideAlerts: "So funktionieren Alerts",
    morphoDashboard: "Du leihst auf Morpho? Öffne das Morpho-Dashboard",
  },
  gate: {
    title: "Verbinde eine Wallet, um fortzufahren",
    description:
      "Tokenping braucht deine Wallet-Adresse, um deine Aave-Positionen anzuzeigen. Das Verbinden bewegt kein Guthaben und kostet keine Gebühr.",
    connect: "Wallet verbinden",
    connecting: "Wird verbunden",
    approveInWallet: "Bestätige die Verbindung in deiner Wallet.",
  },
  positionsHeading: "Deine Aave-Positionen",
  loadingDashboard: "Dein Dashboard wird geladen",
  toolbar: {
    wallet: "Wallet",
    refresh: "Positionen aktualisieren",
    refreshing: "Wird aktualisiert",
    loadingPositions: "Positionen werden geladen",
  },
  errors: {
    positionsDidNotLoad: "Positionen wurden nicht geladen",
    refreshFailed: "Aktualisierung fehlgeschlagen",
    showingLastPositions: "Angezeigt werden die Positionen vom letzten erfolgreichen Laden.",
    tryAgain: "Erneut versuchen",
    fetchPositionsFailed: "Aave-Positionen konnten nicht abgerufen werden",
  },
  totals: {
    supplied: "Eingezahlt gesamt",
    borrowed: "Geliehen gesamt",
    netWorth: "Nettovermögen",
    noData: "Keine Daten",
  },
  networks: {
    heading: "Märkte",
    active: count => `${count} aktiv`,
    noPositions: "In den unterstützten Märkten wurden keine aktiven Aave-Positionen gefunden.",
    selectedRegion: "Ausgewählter Markt",
    noneSelectedTitle: "Kein Markt ausgewählt",
    noneSelectedDescription: "Wähle einen Markt, um seine Aave-Position zu sehen.",
    otherMarkets: count => `Weitere Märkte (${count})`,
    otherMarketsHint:
      "Märkte, die Tokenping geprüft hat und in denen diese Wallet weder eine Position noch einen Alert hat.",
    alertSet: "Alert eingerichtet",
    supplied: usd => `${usd} eingezahlt,`,
    borrowed: usd => `${usd} geliehen`,
    noPosition: "Keine Position",
  },
  healthFactor: {
    srPrefix: "Health Factor ",
    noDebt: "Keine Schulden",
    critical: "Kritisch",
    risky: "Riskant",
    safe: "Sicher",
  },
  position: {
    market: version => (version === 4 ? "Aave-V4-Spoke" : "Aave-V3-Markt"),
    noPositionTitle: chainName => `Keine aktive Position ${deOnMarket(chainName)}`,
    noPositionDetail: chainName =>
      `Aave meldet für diese Wallet ${deOnMarket(chainName)} keine Sicherheiten und keine Schulden.`,
    collateral: "Sicherheiten",
    debt: "Schulden",
    netWorth: "Nettovermögen",
    suppliedTitle: "Eingezahlt",
    borrowedTitle: "Geliehen",
    noCollateral: "Keine Sicherheiten eingezahlt",
    noDebt: "Keine offenen Schulden",
    tokenIconsFrom: "Token- und Netzwerk-Icons von",
    tokenDetailsFailedTitle: "Token-Details wurden nicht geladen",
    tokenDetailsFailedBody:
      "Die Summen oben stammen aus der Kontoübersicht von Aave. Aktualisiere die Positionen, um es erneut zu versuchen.",
  },
  tokens: {
    asset: "Asset",
    supplied: "Eingezahlt",
    supplyApy: "Einzahlungs-APY",
    collateral: "Als Sicherheit",
    borrowed: "Geliehen",
    rateType: "Zinsart",
    enabled: "Aktiviert",
    disabled: "Deaktiviert",
    stable: amount => `Stabil ${amount}`,
    variable: amount => `Variabel ${amount}`,
    count: count => plural("de", count, { one: `${count} Asset`, other: `${count} Assets` }),
  },
  address: {
    defaultLabel: "Adresse",
    copy: (_label, address) => `Adresse ${address} kopieren`,
    copied: "Adresse kopiert",
    copyFailed: "Kopieren fehlgeschlagen. Markiere die Adresse und kopiere sie von Hand.",
  },
  opensInNewTab: "(öffnet in einem neuen Tab)",
  paywall: {
    unlockedUntil: date => `Alerts freigeschaltet bis zum ${date}`,
    titleNew: "Health-Factor-Alerts freischalten",
    titleExtend: "Zugang verlängern, um deine Alerts zu bearbeiten",
    descriptionNew:
      "Zahle einmal, um die Alert-Einstellungen freizuschalten und für jedes Netzwerk einen Health-Factor-Schwellenwert festzulegen. Nichts verlängert sich automatisch: Wenn du verlängern willst, zahlst du aus deiner Wallet.",
    descriptionExtend:
      "Deine bisherigen Alert-Einstellungen sind gespeichert. Zahle erneut, um den Zugang zu verlängern und sie zu bearbeiten.",
    networkDescriptionNew: chainName =>
      `Zahle einmal, um Health-Factor-Alerts ${deOnMarket(chainName)} und in anderen Märkten einzurichten. Nichts verlängert sich automatisch: Wenn du verlängern willst, zahlst du aus deiner Wallet.`,
    networkDescriptionExtend: chainName =>
      `Deine gespeicherten Alert-Einstellungen ${deForMarket(chainName)} sind noch in deinem Konto. Zahle erneut, um den Zugang zu verlängern und sie zu bearbeiten.`,
    connectWallet: "Verbinde deine Wallet, um den Zugang zu bezahlen.",
    unconfigured: "Für dieses Netzwerk ist kein Zahlungs-Contract eingerichtet.",
    noPlan: "Derzeit ist kein bezahlter Plan verfügbar.",
    paused: "Zahlungen sind gerade pausiert. Versuche es später erneut.",
    statusUnavailable: "Der Zahlungsstatus konnte nicht geladen werden. Lade die Seite neu, um es erneut zu versuchen.",
    wrongNetworkTitle: "Falsches Netzwerk",
    wrongNetworkBody: (walletChain, target) =>
      `Deine Wallet ist ${walletChain ? `im Netzwerk ${walletChain}` : "in einem anderen Netzwerk"}. Wechsle ${target ? `zu ${target}` : "zum Zahlungsnetzwerk"}, um zu bezahlen.`,
    switchTo: target => (target ? `Zu ${target} wechseln` : "Zum Zahlungsnetzwerk wechseln"),
    switching: "Netzwerk wird gewechselt",
    loadingDetails: "Zahlungsdetails werden geladen",
    price: "Preis",
    access: "Zugang",
    network: "Netzwerk",
    networkFee: "Netzwerkgebühr",
    networkFeeValue: symbol => `Für jeden Schritt in ${symbol} bezahlt, in deiner Wallet angezeigt`,
    period: (days, about) => {
      const period = plural("de", days, { one: `${days} Tag`, other: `${days} Tage` });
      return about ? `Etwa ${period}` : period;
    },
    pay: amount => `${amount} bezahlen`,
    extend: (days, amount) =>
      `${plural("de", days, { one: `${days} Tag`, other: `${days} Tage` })} für ${amount} hinzufügen`,
    extendHint: days =>
      `Jede Zahlung fügt nach deinem aktuellen Enddatum ${plural("de", days, { one: `${days} Tag`, other: `${days} Tage` })} hinzu. Zahle so oft du willst; nichts verlängert sich von selbst.`,
    accessExtended: date => `Zugang verlängert bis zum ${date}.`,
    accessActive: "Zugang aktiv. Du kannst jetzt die Alerts einrichten.",
    paymentPending: "Zahlung bestätigt. Der Zugang erscheint in Kürze.",
    loading: {
      processing: "Wird verarbeitet",
      waitingForWallet: "Warte auf deine Wallet",
      approving: "Wird freigegeben",
      paying: "Wird bezahlt",
    },
    unavailable: "Bezahlter Zugang ist gerade nicht verfügbar.",
    checkFailed: "Der Zahlungsstatus konnte nicht geprüft werden. Versuche es gleich noch einmal.",
    approvalNotVisible: "Die Freigabe ist bestätigt, aber noch nicht sichtbar. Versuche es gleich noch einmal.",
  },
  payment: {
    stepsLabel: "Zahlungsschritte",
    approveTitle: amount => `${amount} freigeben`,
    approveHint:
      "Erlaubt dem Zahlungs-Contract, genau diesen Betrag einzuziehen. Entfällt, wenn eine frühere Freigabe ihn schon abdeckt.",
    payTitle: amount => `${amount} bezahlen`,
    payHint: "Sendet die Zahlung und schaltet die Alerts frei.",
    inProgress: "Läuft",
    done: "Erledigt",
    notNeeded: "Nicht nötig",
    transaction: "Transaktion ",
    viewOn: explorer => `Auf ${explorer} ansehen`,
    preparingTitle: "Zahlung wird vorbereitet",
    preparingBody: "Der aktuelle Preis und deine Freigabe werden geprüft.",
    confirmTitle: "In deiner Wallet bestätigen",
    approveSignBody: amount => `Schritt 1 von 2: ${amount} freigeben. Nichts wird gesendet, bis du bestätigst.`,
    processingOn: network => (network ? `Wird im Netzwerk ${network} verarbeitet` : "Wird im Netzwerk verarbeitet"),
    approvePendingBody:
      "Schritt 1 von 2: Freigabe gesendet. Als Nächstes bittet dich deine Wallet, die Zahlung zu bestätigen.",
    paySignBody: amount => `Schritt 2 von 2: ${amount} bezahlen. Nichts wird gesendet, bis du bestätigst.`,
    payPendingBody:
      "Schritt 2 von 2: Zahlung gesendet. Die Alerts werden freigeschaltet, sobald das Netzwerk sie bestätigt.",
  },
};
