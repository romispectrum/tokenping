import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal, plural } from "~~/i18n/format";

/** "30 Tage", "1 Tag". */
const deDays = (days: number) => plural("de", days, { one: `${days} Tag`, other: `${days} Tage` });

/** "alle 5 Minuten", "jede Minute". */
const deEveryMinutes = (minutes: number) =>
  plural("de", minutes, { one: "jede Minute", other: `alle ${minutes} Minuten` });

/** "29 Netzwerke", "1 Netzwerk". */
const deNetworks = (networks: number) =>
  plural("de", networks, { one: `${networks} Netzwerk`, other: `${networks} Netzwerke` });

/** "auf 29 Netzwerken", "auf 1 Netzwerk" (dative). */
const deOnNetworks = (networks: number) =>
  plural("de", networks, { one: `auf ${networks} Netzwerk`, other: `auf ${networks} Netzwerken` });

/** "24 V3-Märkte", "1 V3-Markt". */
const deV3Markets = (markets: number) =>
  plural("de", markets, { one: `${markets} V3-Markt`, other: `${markets} V3-Märkte` });

/** "13 V4-Spokes", "1 V4-Spoke". */
const deV4Spokes = (spokes: number) =>
  plural("de", spokes, { one: `${spokes} V4-Spoke`, other: `${spokes} V4-Spokes` });

/** "auf Arbitrum One", or the payment network unnamed. */
const deOnChain = (chainName: string | undefined) => (chainName ? `auf ${chainName}` : "im Zahlungsnetzwerk");

export const MESSAGES: HomeMessages = {
  headline: channels => `Health-Factor-Alerts für Aave und Morpho über ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Alerts über ${channels}, wenn dein Health Factor auf Aave oder Morpho unter deinem Schwellenwert liegt, ${deOnNetworks(networks)}, ${deEveryMinutes(minutes)}.`
      : `Alerts über ${channels}, wenn dein Health Factor auf Aave oder Morpho unter deinen Schwellenwert fällt, ${deOnNetworks(networks)}. Prüfung ${deEveryMinutes(minutes)}.`,
  // The channel names arrive in English ("email"); German writes the badge "E-Mail".
  channelBadge: name => (name.toLowerCase() === "email" ? "E-Mail" : capitalize(name)),
  pricingCta: plan =>
    plan ? `Alerts einrichten: ${formatDecimal("de", plan.priceLabel)} für ${deDays(plan.days)}` : "Alerts einrichten",
  offerDescription: ({ days, currency }) =>
    `Health-Factor-Alerts für ${deDays(days)}, bezahlt in ${currency} aus deiner Wallet. Keine automatische Verlängerung.`,

  kicker: "Aave V3 und V4, Morpho Blue und Midnight",
  heroLead: ({ minutes, channels }) =>
    `Prüfung ${deEveryMinutes(minutes)}. Eine Nachricht über ${channels}, solange du unter deiner Grenze bist. Nur lesend, keine Freigaben.`,
  networksLabel: "Netzwerke",
  heroCoverage: networks => deNetworks(networks),
  channelsLabel: "Alerts über:",
  exampleAlertLabel: "Was in einem Alert steht",
  exampleAlertCaption: subject => `Beispiel. E-Mails kommen mit dem Betreff „${subject}“.`,

  dashboardCta: "Aave-Dashboard öffnen",
  morphoDashboardCta: "Morpho-Dashboard öffnen",
  dashboardCtaMicrocopy: alertPrice => `Verbinde eine Wallet und sieh alle Positionen. Alerts kosten ${alertPrice}.`,

  problemTitle: "Der Health Factor fällt, während du schläfst",
  problemLead:
    "Aave zeigt deinen Health Factor, schickt aber keine Alerts (Oktober 2026). Drei Dinge bewegen ihn über Nacht:",
  problemCauses: [
    { title: "Preise fallen", body: "ETH fällt, und deine Sicherheiten sind weniger wert." },
    { title: "Zinsen laufen auf", body: "Deine Schulden wachsen jede Sekunde." },
    { title: "Schwellen ändern sich", body: "Auf Aave kann die Governance eine Liquidationsschwelle senken." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Kreditnehmer berichten von ",
      morning("einer liquidierten Position am Morgen"),
      ", ",
      failedRepays("einer Stunde fehlgeschlagener Rückzahlungen"),
      " und ",
      polygon("einer Rückzahlung bei 1,01, die zu spät kam"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "Der Liquidator behält obendrein einen Bonus: 5 % auf WETH im Core-Markt auf Ethereum (Oktober 2026).",
      guide && rich(" Mehr dazu: ", guide("wie eine Liquidation abläuft"), "."),
    ),
  chart: {
    threshold: "dein Schwellenwert",
    liquidation: "Liquidation",
    alertSent: "Alert gesendet",
    youCheck: "Du schaust aufs Handy",
    caption:
      "Eine Beispielnacht. Der Alert geht um 03:05 raus, bei der ersten Prüfung unter 1,5, fünf Stunden bevor du nachsiehst.",
  },

  howItWorksTitle: "So funktioniert es",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` auf ${paymentChain}` : "";
    return [
      {
        title: "Verbinde die Wallet, mit der du leihst",
        body: "Nur lesend. Aave und Morpho, je eine Seite.",
      },
      {
        title: plan
          ? `Schalte Alerts für ${formatDecimal("de", plan.priceLabel)} frei`
          : "Schalte Alerts mit einer kleinen USDC-Zahlung frei",
        body: `${plan ? `${deDays(plan.days)} Zugang, bezahlt` : "Bezahlt"} in USDC${paidOn}. Keine automatische Verlängerung.`,
      },
      {
        title: "Wähle eine Grenze für jeden Markt",
        body: `Von ${formatDecimal("de", threshold.min)} (${formatDecimal("de", morphoMin)} auf Morpho) bis ${formatDecimal("de", threshold.max)}, Standard ${formatDecimal("de", threshold.default)}.`,
      },
      {
        title: "Erhalte Nachrichten, solange du darunter bist",
        body: `${capitalize(deEveryMinutes(minutes))}, über ${channels}, bis du wieder über deiner Grenze bist.`,
      },
    ];
  },
  scaleTitle: "Wo deine Grenze liegen sollte",
  scale: {
    liquidation: "Liquidation",
    critical: "Kritisch",
    risky: "Riskant",
    safe: "Sicher",
    defaultThreshold: value => `Standard: ${value}`,
    below: value => `Unter ${value}`,
    between: (from, to) => `${from} bis ${to}`,
    andAbove: value => `${value} und mehr`,
    range: (min, max) => `Jeder Wert von ${min} bis ${max}.`,
  },
  scaleGuide: "Wie du einen Schwellenwert wählst",

  coverageTitle: "Jeder Aave-Markt und jeder gelistete Morpho-Markt",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${deV3Markets(v3Markets)} von Aave ${deOnNetworks(v3Networks)} und ${deV4Spokes(spokes)} von Aave ${deOnNetworks(v4Networks)}, Stand 4. November 2026, dazu jeder gelistete Morpho-Markt ${deOnNetworks(morphoNetworks)}.`,
  coverage: {
    v3Markets: count => deV3Markets(count),
    v4Spokes: count => deV4Spokes(count),
    morpho: "Morpho",
  },
  coverageNote:
    "Scroll, ZKsync, Metis, Soneium und Sonic werden von der Aave-Governance abgewickelt und weiter überwacht. Nicht abgedeckt: Aave V3 auf Harmony, nicht gelistete Morpho-Märkte und andere Protokolle.",

  pricingTitle: "Preise",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Alerts", detail: capitalize(alertPrice) },
    { term: "Verlängerung", detail: "Nicht automatisch: zahl erneut, wenn du mehr Zeit willst" },
    {
      term: "Zahlung",
      detail: paymentChain
        ? `USDC auf ${paymentChain}, aus deiner Wallet (freigeben, dann bezahlen)`
        : "USDC, aus deiner Wallet",
    },
  ],
  priceSource: "Der Preis wird aus dem Zahlungsvertrag gelesen und stündlich aktualisiert.",
  pricingFootnote: "Positionen ansehen braucht keine Zahlung.",

  questionsTitle: "Fragen, bevor du eine Wallet verbindest",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = deOnChain(paymentChain);
    return [
      {
        question: "Kann Tokenping auf mein Geld zugreifen?",
        answer: rich(
          `Nein. Tokenping liest nur deine Positionen und fragt auf Aave oder Morpho nie nach einer Freigabe oder Signatur. Die einzigen Transaktionen sind die Zahlung ${onChain}: eine Freigabe über genau den Preis, dann die Zahlung. `,
          links.sourcify
            ? rich(
                "Der Vertrag ist ",
                links.sourcify("auf Sourcify verifiziert"),
                " und sein ",
                links.sourceCode("Quellcode ist öffentlich"),
              )
            : links.sourceCode("Der Quellcode des Vertrags ist öffentlich"),
          "; die Wallet des Teams kann seinen Preis ändern, ihn pausieren und upgraden.",
        ),
      },
      {
        question: "Was speichert ihr?",
        answer: rich(
          "Deine Wallet-Adresse, deine Alerts und die Kontaktdaten, die du angibst (E-Mail, Signal-Benutzername",
          hasTelegram ? ", Telegram-Chat" : "",
          `). Kein Verlauf und keine Tracking-Cookies; Seitenaufrufe werden anonym gezählt. Nur wer mit deiner Wallet signieren kann, kann diese Kontaktdaten lesen, aber Zahlungen sind ${onChain} öffentlich. Die `,
          links.privacy("Datenschutzseite"),
          " enthält die vollständige Liste.",
        ),
      },
      {
        question: "Was kostet es?",
        answer: rich(
          `Alerts kosten ${alertPrice}, in USDC ${onChain}, plus etwas ETH für Gas. Positionen ansehen braucht keine Zahlung. Keine automatische Verlängerung, keine Erstattungen.`,
        ),
      },
      {
        question: "Welche Morpho-Kredite sind abgedeckt?",
        answer: rich(
          `Kredite auf Morpho Blue (variabler Zinssatz) und Morpho Midnight (fester Zinssatz) in Märkten, die die Morpho-App listet, mit Schwellenwerten ab ${formatDecimal("de", morphoMin)}. Ein Festzinskredit bekommt außerdem Erinnerungen vor der Fälligkeit. Derselbe Plan deckt sie ab: öffne das `,
          links.morphoDashboard("Morpho-Dashboard"),
          ".",
        ),
      },
      {
        question: "Was, wenn ein Alert nicht ankommt?",
        answer: rich(
          `Die nächste Prüfung, ${plural("de", minutes, { one: "1 Minute", other: `${minutes} Minuten` })} später, versucht es erneut. Die Zustellung hängt von Resend, einem Signal-Relay,`,
          hasTelegram ? " der Telegram Bot API," : "",
          " öffentlichen RPC-Knoten und dem Scheduler von Vercel ab, ohne Verfügbarkeitsgarantie. Wähle zwei Kanäle und lass dir Zeit zum Handeln.",
        ),
      },
      {
        question: "Wie stoppe ich die Alerts?",
        answer: rich(
          "Sie stoppen, sobald dein Health Factor wieder über deiner Grenze liegt oder wenn du den Alert löschst (braucht aktiven Zugang). Zugang abgelaufen? Schreib uns auf ",
          links.x("X"),
          " oder in unserer Community auf ",
          links.telegramCommunity("Telegram"),
          " oder ",
          links.signalCommunity("Signal"),
          ".",
          hasTelegram ? " In Telegram funktioniert auch /stop." : "",
          " Noch kein Pausieren und kein Abmeldelink.",
        ),
      },
      {
        question: "Kann ich eine Wallet beobachten, die ich nicht verbinde?",
        answer: rich("Derzeit nicht. Eine Wallet, die du verbindest; der Zugang gilt pro Wallet."),
      },
      {
        question: "Andere Tools kosten nichts. Warum bezahlen?",
        answer: rich(
          "Wenn dir ein Telegram-Bot oder eine Mobile-App reicht, nutze sie",
          links.comparison ? rich(": ", links.comparison("unser Vergleich"), " stellt sie vor") : null,
          ". Tokenping ist für Alerts über Signal oder E-Mail, in jedem Aave-Markt und jedem gelisteten Morpho-Markt.",
        ),
      },
    ];
  },

  limitsTitle: "Einschränkungen, klar gesagt",
  limits: ({ minutes, paymentChain }) => [
    `Prüfung ${deEveryMinutes(minutes)}, nicht laufend.`,
    "Jede Prüfung unter deiner Grenze schickt eine weitere Nachricht: kein Pausieren, keine Zusammenfassung.",
    "Eine Grenze pro Markt, nur für die verbundene Wallet.",
    `Nur USDC${paymentChain ? ` auf ${paymentChain}` : ""}: keine Karten, keine Erstattungen.`,
    "Noch kein Abmeldelink in E-Mails; einen Alert zu löschen braucht aktiven Zugang.",
    "Beta: Zustellung über Dritte, keine Verfügbarkeitsgarantie.",
  ],

  blogTitle: "Aus dem Blog",
  allGuides: "Alle Ratgeber zu Aave und Morpho",

  closingTitle: "Richte deinen Health-Factor-Alert für Aave oder Morpho ein",
  closingLead: alertPrice => `${capitalize(alertPrice)}, bezahlt aus deiner Wallet. Keine automatische Verlängerung.`,
};
