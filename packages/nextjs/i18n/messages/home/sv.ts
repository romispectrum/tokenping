import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal, plural } from "~~/i18n/format";

/** "30 dagar", "1 dag". */
const svDays = (days: number) => plural("sv", days, { one: `${days} dag`, other: `${days} dagar` });

/** "var 5 minuter", "en gång i minuten". */
const svEveryMinutes = (minutes: number) =>
  plural("sv", minutes, { one: "en gång i minuten", other: `var ${minutes} minuter` });

/** "29 nätverk", "1 nätverk": the same form in both. */
const svNetworks = (networks: number) => `${networks} nätverk`;

/** "24 V3-marknader", "1 V3-marknad". */
const svV3Markets = (markets: number) =>
  plural("sv", markets, { one: `${markets} V3-marknad`, other: `${markets} V3-marknader` });

/** "13 V4-Spokes", "1 V4-Spoke". */
const svV4Spokes = (spokes: number) =>
  plural("sv", spokes, { one: `${spokes} V4-Spoke`, other: `${spokes} V4-Spokes` });

/** "på Arbitrum One", or the payment network unnamed. */
const svOnChain = (chainName: string | undefined) => (chainName ? `på ${chainName}` : "på betalningsnätverket");

export const MESSAGES: HomeMessages = {
  headline: channels => `Health factor-larm för Aave och Morpho via ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Larm via ${channels} när din health factor på Aave eller Morpho är under ditt tröskelvärde, på ${svNetworks(networks)}, ${svEveryMinutes(minutes)}.`
      : `Larm via ${channels} när din health factor på Aave eller Morpho sjunker under ditt tröskelvärde, på ${svNetworks(networks)}. Kontroll ${svEveryMinutes(minutes)}.`,
  channelBadge: capitalize,
  pricingCta: plan =>
    plan ? `Ställ in larm: ${formatDecimal("sv", plan.priceLabel)} för ${svDays(plan.days)}` : "Ställ in larm",
  offerDescription: ({ days, currency }) =>
    `Health factor-larm i ${svDays(days)}, betalt i ${currency} från din plånbok. Ingen automatisk förnyelse.`,

  kicker: "Aave V3 och V4, Morpho Blue och Midnight",
  heroLead: ({ minutes, channels }) =>
    `Kontroll ${svEveryMinutes(minutes)}. Ett meddelande via ${channels} så länge du ligger under din gräns. Endast läsning, inga godkännanden.`,
  networksLabel: "Nätverk",
  heroCoverage: networks => svNetworks(networks),
  channelsLabel: "Larm via:",
  exampleAlertLabel: "Vad ett larm säger",
  exampleAlertCaption: subject => `Exempel. E-postmeddelanden kommer med ämnet ”${subject}”.`,

  dashboardCta: "Öppna översikten för Aave",
  morphoDashboardCta: "Öppna översikten för Morpho",
  dashboardCtaMicrocopy: alertPrice => `Anslut en plånbok och se alla positioner. Larm kostar ${alertPrice}.`,

  problemTitle: "Din health factor sjunker medan du sover",
  problemLead:
    "Aave visar din health factor men skickar inga larm (oktober 2026). Tre saker får den att röra sig under natten:",
  problemCauses: [
    { title: "Priser faller", body: "ETH faller och din säkerhet blir mindre värd." },
    { title: "Räntan växer", body: "Din skuld ökar varje sekund." },
    { title: "Trösklar ändras", body: "På Aave kan governance sänka en likvidationströskel." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Låntagare berättar om att ",
      morning("vakna upp till en likviderad position"),
      ", om ",
      failedRepays("en timme av misslyckade återbetalningar"),
      " och om ",
      polygon("en återbetalning vid 1,01 som kom för sent"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "Likvidatorn behåller dessutom en bonus: 5 % på WETH i Core-marknaden på Ethereum (oktober 2026).",
      guide && rich(" Läs ", guide("hur en likvidation går till"), "."),
    ),
  chart: {
    threshold: "ditt tröskelvärde",
    liquidation: "likvidation",
    alertSent: "Larm skickat",
    youCheck: "Du tittar på telefonen",
    caption: "En exempelnatt. Larmet skickas 03:05, vid den första kontrollen under 1,5, fem timmar innan du tittar.",
  },

  howItWorksTitle: "Så fungerar det",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` på ${paymentChain}` : "";
    return [
      {
        title: "Anslut plånboken du lånar med",
        body: "Endast läsning. Aave och Morpho, en sida var.",
      },
      {
        title: plan
          ? `Lås upp larm för ${formatDecimal("sv", plan.priceLabel)}`
          : "Lås upp larm med en liten betalning i USDC",
        body: `${plan ? `${svDays(plan.days)} åtkomst, betalt` : "Betalt"} i USDC${paidOn}. Ingen automatisk förnyelse.`,
      },
      {
        title: "Välj en gräns för varje marknad",
        body: `Från ${formatDecimal("sv", threshold.min)} (${formatDecimal("sv", morphoMin)} på Morpho) till ${formatDecimal("sv", threshold.max)}, standard ${formatDecimal("sv", threshold.default)}.`,
      },
      {
        title: "Få meddelanden så länge du ligger under den",
        body: `${capitalize(svEveryMinutes(minutes))}, via ${channels}, tills du är över din gräns igen.`,
      },
    ];
  },
  scaleTitle: "Var du ska lägga din gräns",
  scale: {
    liquidation: "likvidation",
    critical: "Kritisk",
    risky: "Riskabel",
    safe: "Säker",
    defaultThreshold: value => `Standard ${value}`,
    below: value => `Under ${value}`,
    between: (from, to) => `${from} till ${to}`,
    andAbove: value => `${value} och högre`,
    range: (min, max) => `Valfritt värde från ${min} till ${max}.`,
  },
  scaleGuide: "Så väljer du ett tröskelvärde",

  coverageTitle: "Varje marknad på Aave och varje listad marknad på Morpho",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${svV3Markets(v3Markets)} på Aave på ${svNetworks(v3Networks)} och ${svV4Spokes(spokes)} på Aave på ${svNetworks(v4Networks)}, per 16 oktober 2026, plus varje listad marknad på Morpho på ${svNetworks(morphoNetworks)}.`,
  coverage: {
    v3Markets: count => svV3Markets(count),
    v4Spokes: count => svV4Spokes(count),
    morpho: "Morpho",
  },
  coverageNote:
    "Scroll, ZKsync, Metis, Soneium och Sonic avvecklas av Aaves governance och bevakas fortfarande. Täcks inte: Aave V3 på Harmony, olistade marknader på Morpho och andra protokoll.",

  pricingTitle: "Priser",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Larm", detail: capitalize(alertPrice) },
    { term: "Förnyelse", detail: "Inte automatisk: betala igen när du vill ha mer tid" },
    {
      term: "Betalning",
      detail: paymentChain
        ? `USDC på ${paymentChain}, från din plånbok (godkänn, betala sedan)`
        : "USDC, från din plånbok",
    },
  ],
  priceSource: "Priset läses från betalningskontraktet och uppdateras varje timme.",
  pricingFootnote: "Att se dina positioner kräver ingen betalning.",

  questionsTitle: "Frågor att ställa innan du ansluter en plånbok",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = svOnChain(paymentChain);
    return [
      {
        question: "Kan Tokenping komma åt mina pengar?",
        answer: rich(
          `Nej. Tokenping läser bara dina positioner och ber aldrig om ett godkännande eller en signatur på Aave eller Morpho. De enda transaktionerna är betalningen ${onChain}: ett godkännande för exakt priset, sedan betalningen. `,
          links.sourcify
            ? rich(
                "Kontraktet är ",
                links.sourcify("verifierat på Sourcify"),
                " och dess ",
                links.sourceCode("källkod är öppen"),
              )
            : links.sourceCode("Kontraktets källkod är öppen"),
          "; teamets plånbok kan ändra priset, pausa kontraktet och uppgradera det.",
        ),
      },
      {
        question: "Vad sparar Tokenping?",
        answer: rich(
          "Din plånboksadress, dina larm och de kontaktuppgifter du anger (e-post, användarnamn på Signal",
          hasTelegram ? ", Telegram-chatt" : "",
          `). Ingen historik och inga spårningscookies; sidvisningar räknas anonymt. Bara den som kan signera med din plånbok kan läsa kontaktuppgifterna, men betalningar är offentliga ${onChain}. `,
          links.privacy("Integritetssidan"),
          " har hela listan.",
        ),
      },
      {
        question: "Vad kostar det?",
        answer: rich(
          `Larm kostar ${alertPrice}, i USDC ${onChain}, plus lite ETH för gas. Att se dina positioner kräver ingen betalning. Ingen automatisk förnyelse, ingen återbetalning.`,
        ),
      },
      {
        question: "Vilka lån på Morpho täcks?",
        answer: rich(
          `Lån på Morpho Blue (rörlig ränta) och Morpho Midnight (fast ränta) i marknader som Morpho-appen listar, med tröskelvärden från ${formatDecimal("sv", morphoMin)}. Ett lån med fast ränta får också påminnelser före förfallodagen. Samma plan täcker dem: öppna `,
          links.morphoDashboard("översikten för Morpho"),
          ".",
        ),
      },
      {
        question: "Vad händer om ett larm inte kommer fram?",
        answer: rich(
          `Nästa kontroll, ${plural("sv", minutes, { one: "1 minut", other: `${minutes} minuter` })} senare, försöker igen. Leveransen bygger på Resend, ett Signal-relä,`,
          hasTelegram ? " Telegram Bot API," : "",
          " publika RPC-noder och Vercels schemaläggare, utan garanti för drifttid. Välj två kanaler och ge dig själv marginal att agera.",
        ),
      },
      {
        question: "Hur stoppar jag larmen?",
        answer: rich(
          "De slutar när din health factor är över din gräns igen, eller när du tar bort larmet (det kräver aktiv åtkomst). Har åtkomsten gått ut? Skriv till oss på ",
          links.x("X"),
          " eller i vår community på ",
          links.telegramCommunity("Telegram"),
          " eller ",
          links.signalCommunity("Signal"),
          ".",
          hasTelegram ? " I Telegram fungerar /stop också." : "",
          " Ingen snooze-funktion och ingen avregistreringslänk än.",
        ),
      },
      {
        question: "Kan jag bevaka en plånbok som jag inte ansluter?",
        answer: rich("Inte i dag. En plånbok, den du ansluter; åtkomsten gäller per plånbok."),
      },
      {
        question: "Andra verktyg kostar ingenting. Varför betala?",
        answer: rich(
          "Om en Telegram-bot eller en mobilapp passar dig bättre, använd en sådan",
          links.comparison ? rich(": ", links.comparison("vår jämförelse"), " går igenom dem") : null,
          ". Tokenping är till för larm via Signal eller e-post, i varje marknad på Aave och varje listad marknad på Morpho.",
        ),
      },
    ];
  },

  limitsTitle: "Begränsningar, rakt på sak",
  limits: ({ minutes, paymentChain }) => [
    `Kontroll ${svEveryMinutes(minutes)}, inte kontinuerligt.`,
    "Varje kontroll under din gräns skickar ett nytt meddelande: ingen snooze eller sammanfattning.",
    "En gräns per marknad, bara för den anslutna plånboken.",
    `Bara USDC${paymentChain ? ` på ${paymentChain}` : ""}: inga kort, ingen återbetalning.`,
    "Ingen avregistreringslänk i e-post än; att ta bort ett larm kräver aktiv åtkomst.",
    "Beta: leverans via tredje part, ingen garanti för drifttid.",
  ],

  blogTitle: "Från bloggen",
  allGuides: "Alla guider om Aave och Morpho",

  closingTitle: "Ställ in ditt health factor-larm för Aave eller Morpho",
  closingLead: alertPrice => `${capitalize(alertPrice)}, betalt från din plånbok. Ingen automatisk förnyelse.`,
};
