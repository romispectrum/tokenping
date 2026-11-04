import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal, plural } from "~~/i18n/format";

/** "30 dagen", "1 dag". */
const nlDays = (days: number) => plural("nl", days, { one: `${days} dag`, other: `${days} dagen` });

/** "elke 5 minuten", "elke minuut". */
const nlEveryMinutes = (minutes: number) =>
  plural("nl", minutes, { one: "elke minuut", other: `elke ${minutes} minuten` });

/** "29 netwerken", "1 netwerk". */
const nlNetworks = (networks: number) =>
  plural("nl", networks, { one: `${networks} netwerk`, other: `${networks} netwerken` });

/** "24 V3-markten", "1 V3-markt". */
const nlV3Markets = (markets: number) =>
  plural("nl", markets, { one: `${markets} V3-markt`, other: `${markets} V3-markten` });

/** "13 V4-Spokes", "1 V4-Spoke". */
const nlV4Spokes = (spokes: number) =>
  plural("nl", spokes, { one: `${spokes} V4-Spoke`, other: `${spokes} V4-Spokes` });

/** "op Arbitrum One", or the payment network unnamed. */
const nlOnChain = (chainName: string | undefined) => (chainName ? `op ${chainName}` : "op het betaalnetwerk");

export const MESSAGES: HomeMessages = {
  headline: channels => `Health factor-alerts voor Aave en Morpho via ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Alerts via ${channels} als je health factor op Aave of Morpho onder je drempel ligt, op ${nlNetworks(networks)}, ${nlEveryMinutes(minutes)}.`
      : `Alerts via ${channels} als je health factor op Aave of Morpho onder je drempel zakt, op ${nlNetworks(networks)}. Gecontroleerd ${nlEveryMinutes(minutes)}.`,
  channelBadge: capitalize,
  pricingCta: plan =>
    plan ? `Alerts instellen: ${formatDecimal("nl", plan.priceLabel)} voor ${nlDays(plan.days)}` : "Alerts instellen",
  offerDescription: ({ days, currency }) =>
    `Health factor-alerts voor ${nlDays(days)}, betaald in ${currency} vanuit je wallet. Geen automatische verlenging.`,

  kicker: "Aave V3 en V4, Morpho Blue en Midnight",
  heroLead: ({ minutes, channels }) =>
    `Gecontroleerd ${nlEveryMinutes(minutes)}. Een bericht via ${channels} zolang je onder je grens zit. Alleen-lezen, geen goedkeuringen.`,
  networksLabel: "Netwerken",
  heroCoverage: networks => nlNetworks(networks),
  channelsLabel: "Alerts via:",
  exampleAlertLabel: "Wat er in een alert staat",
  exampleAlertCaption: subject => `Voorbeeld. E-mails komen binnen met het onderwerp "${subject}".`,

  dashboardCta: "Aave-dashboard openen",
  morphoDashboardCta: "Morpho-dashboard openen",
  dashboardCtaMicrocopy: alertPrice => `Koppel een wallet en zie al je posities. Alerts kosten ${alertPrice}.`,

  problemTitle: "Je health factor zakt terwijl je slaapt",
  problemLead:
    "Aave toont je health factor, maar stuurt geen alerts (oktober 2026). Drie dingen laten hem 's nachts bewegen:",
  problemCauses: [
    { title: "Prijzen dalen", body: "ETH daalt en je onderpand is minder waard." },
    { title: "Rente loopt op", body: "Je schuld groeit elke seconde." },
    { title: "Drempels veranderen", body: "Op Aave kan governance een liquidatiedrempel verlagen." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Leners vertellen over ",
      morning("wakker worden met een geliquideerde positie"),
      ", ",
      failedRepays("een uur aan mislukte aflossingen"),
      " en ",
      polygon("een aflossing bij 1,01 die te laat kwam"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "De liquidator houdt er ook nog een bonus aan over: 5% op WETH in de Core-markt op Ethereum (oktober 2026).",
      guide && rich(" Lees ", guide("hoe een liquidatie werkt"), "."),
    ),
  chart: {
    threshold: "je drempel",
    liquidation: "liquidatie",
    alertSent: "Alert verstuurd",
    youCheck: "Je kijkt op je telefoon",
    caption:
      "Een voorbeeldnacht. De alert wordt om 03:05 verstuurd, bij de eerste controle onder 1,5, vijf uur voordat je kijkt.",
  },

  howItWorksTitle: "Zo werkt het",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` op ${paymentChain}` : "";
    return [
      {
        title: "Koppel de wallet waarmee je leent",
        body: "Alleen-lezen. Aave en Morpho, elk een eigen pagina.",
      },
      {
        title: plan
          ? `Ontgrendel alerts voor ${formatDecimal("nl", plan.priceLabel)}`
          : "Ontgrendel alerts met een kleine betaling in USDC",
        body: `${plan ? `${nlDays(plan.days)} toegang, betaald` : "Betaald"} in USDC${paidOn}. Geen automatische verlenging.`,
      },
      {
        title: "Kies een grens voor elke markt",
        body: `Van ${formatDecimal("nl", threshold.min)} (${formatDecimal("nl", morphoMin)} op Morpho) tot ${formatDecimal("nl", threshold.max)}, standaard ${formatDecimal("nl", threshold.default)}.`,
      },
      {
        title: "Krijg berichten zolang je eronder zit",
        body: `${capitalize(nlEveryMinutes(minutes))}, via ${channels}, tot je weer boven je grens zit.`,
      },
    ];
  },
  scaleTitle: "Waar je je grens legt",
  scale: {
    liquidation: "liquidatie",
    critical: "Kritiek",
    risky: "Riskant",
    safe: "Veilig",
    defaultThreshold: value => `Standaard ${value}`,
    below: value => `Onder ${value}`,
    between: (from, to) => `${from} tot ${to}`,
    andAbove: value => `${value} en hoger`,
    range: (min, max) => `Elke waarde van ${min} tot ${max}.`,
  },
  scaleGuide: "Zo kies je een drempel",

  coverageTitle: "Elke Aave-markt en elke vermelde Morpho-markt",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${nlV3Markets(v3Markets)} van Aave op ${nlNetworks(v3Networks)} en ${nlV4Spokes(spokes)} van Aave op ${nlNetworks(v4Networks)}, per 4 november 2026, plus elke vermelde Morpho-markt op ${nlNetworks(morphoNetworks)}.`,
  coverage: {
    v3Markets: count => nlV3Markets(count),
    v4Spokes: count => nlV4Spokes(count),
    morpho: "Morpho",
  },
  coverageNote:
    "Scroll, ZKsync, Metis, Soneium en Sonic worden door Aave-governance afgebouwd en blijven bewaakt. Niet gedekt: Aave V3 op Harmony, niet-vermelde Morpho-markten en andere protocollen.",

  pricingTitle: "Prijzen",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Alerts", detail: capitalize(alertPrice) },
    { term: "Verlenging", detail: "Niet automatisch: betaal opnieuw als je meer tijd wilt" },
    {
      term: "Betaling",
      detail: paymentChain
        ? `USDC op ${paymentChain}, vanuit je wallet (goedkeuren, dan betalen)`
        : "USDC, vanuit je wallet",
    },
  ],
  priceSource: "De prijs wordt uit het betaalcontract gelezen en elk uur bijgewerkt.",
  pricingFootnote: "Je posities bekijken kost niets.",

  questionsTitle: "Vragen voordat je een wallet koppelt",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = nlOnChain(paymentChain);
    return [
      {
        question: "Kan Tokenping bij mijn geld?",
        answer: rich(
          `Nee. Tokenping leest alleen je posities en vraagt op Aave of Morpho nooit om een goedkeuring of een handtekening. De enige transacties zijn de betaling ${onChain}: een goedkeuring voor precies de prijs, daarna de betaling. `,
          links.sourcify
            ? rich(
                "Het contract is ",
                links.sourcify("geverifieerd op Sourcify"),
                " en de ",
                links.sourceCode("broncode is openbaar"),
              )
            : links.sourceCode("De broncode van het contract is openbaar"),
          "; de wallet van het team kan de prijs wijzigen, het contract pauzeren en upgraden.",
        ),
      },
      {
        question: "Wat slaan jullie op?",
        answer: rich(
          "Je walletadres, je alerts en de contactgegevens die je opgeeft (e-mail, Signal-gebruikersnaam",
          hasTelegram ? ", Telegram-chat" : "",
          `). Geen geschiedenis en geen trackingcookies; paginaweergaven worden anoniem geteld. Alleen wie met je wallet kan ondertekenen, kan die contactgegevens lezen, maar betalingen zijn openbaar ${onChain}. De `,
          links.privacy("privacypagina"),
          " heeft de volledige lijst.",
        ),
      },
      {
        question: "Wat kost het?",
        answer: rich(
          `Alerts kosten ${alertPrice}, in USDC ${onChain}, plus een beetje ETH voor gas. Je posities bekijken kost niets. Geen automatische verlenging, geen terugbetalingen.`,
        ),
      },
      {
        question: "Welke Morpho-leningen worden gedekt?",
        answer: rich(
          `Leningen op Morpho Blue (variabele rente) en Morpho Midnight (vaste rente) in markten die de Morpho-app vermeldt, met drempels vanaf ${formatDecimal("nl", morphoMin)}. Een lening met vaste rente krijgt ook herinneringen vóór de vervaldatum. Hetzelfde plan dekt ze: open het `,
          links.morphoDashboard("Morpho-dashboard"),
          ".",
        ),
      },
      {
        question: "Wat als een alert niet aankomt?",
        answer: rich(
          `De volgende controle, ${plural("nl", minutes, { one: "1 minuut", other: `${minutes} minuten` })} later, probeert het opnieuw. De bezorging hangt af van Resend, een Signal-relay,`,
          hasTelegram ? " de Telegram Bot API," : "",
          " openbare RPC-nodes en de planner van Vercel, zonder garantie op beschikbaarheid. Kies twee kanalen en houd ruimte om te handelen.",
        ),
      },
      {
        question: "Hoe stop ik de alerts?",
        answer: rich(
          "Ze stoppen zodra je health factor weer boven je grens ligt, of als je de alert verwijdert (daarvoor heb je actieve toegang nodig). Toegang verlopen? Stuur ons een bericht op ",
          links.x("X"),
          " of in onze community op ",
          links.telegramCommunity("Telegram"),
          " of ",
          links.signalCommunity("Signal"),
          ".",
          hasTelegram ? " In Telegram werkt /stop ook." : "",
          " Nog geen sluimerknop en geen afmeldlink.",
        ),
      },
      {
        question: "Kan ik een wallet volgen die ik niet koppel?",
        answer: rich("Nu nog niet. Eén wallet, de wallet die je koppelt; toegang geldt per wallet."),
      },
      {
        question: "Andere tools kosten niets. Waarom betalen?",
        answer: rich(
          "Past een Telegram-bot of een mobiele app beter bij je, gebruik die dan",
          links.comparison ? rich(": ", links.comparison("onze vergelijking"), " bespreekt ze") : null,
          ". Tokenping is er voor alerts via Signal of e-mail, in elke Aave-markt en elke vermelde Morpho-markt.",
        ),
      },
    ];
  },

  limitsTitle: "Beperkingen, eerlijk gezegd",
  limits: ({ minutes, paymentChain }) => [
    `Controle ${nlEveryMinutes(minutes)}, niet doorlopend.`,
    "Elke controle onder je grens stuurt opnieuw een bericht: geen sluimerfunctie of samenvatting.",
    "Eén grens per markt, alleen voor de gekoppelde wallet.",
    `Alleen USDC${paymentChain ? ` op ${paymentChain}` : ""}: geen kaarten, geen terugbetalingen.`,
    "Nog geen afmeldlink in e-mails; een alert verwijderen vraagt actieve toegang.",
    "Bèta: bezorging via derden, geen garantie op beschikbaarheid.",
  ],

  blogTitle: "Uit de blog",
  allGuides: "Alle gidsen over Aave en Morpho",

  closingTitle: "Stel je health factor-alert voor Aave of Morpho in",
  closingLead: alertPrice => `${capitalize(alertPrice)}, betaald vanuit je wallet. Geen automatische verlenging.`,
};
