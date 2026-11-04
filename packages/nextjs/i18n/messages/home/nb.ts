import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal, plural } from "~~/i18n/format";

/** "30 dager", "1 dag". */
const nbDays = (days: number) => plural("nb", days, { one: `${days} dag`, other: `${days} dager` });

/** "hvert 5. minutt", "hvert minutt". */
const nbEveryMinutes = (minutes: number) =>
  plural("nb", minutes, { one: "hvert minutt", other: `hvert ${minutes}. minutt` });

/** "29 nettverk", "1 nettverk": the same form in both. */
const nbNetworks = (networks: number) => `${networks} nettverk`;

/** "24 V3-markeder", "1 V3-marked". */
const nbV3Markets = (markets: number) =>
  plural("nb", markets, { one: `${markets} V3-marked`, other: `${markets} V3-markeder` });

/** "13 V4-Spokes", "1 V4-Spoke". */
const nbV4Spokes = (spokes: number) =>
  plural("nb", spokes, { one: `${spokes} V4-Spoke`, other: `${spokes} V4-Spokes` });

/** "på Arbitrum One", or the payment network unnamed. */
const nbOnChain = (chainName: string | undefined) => (chainName ? `på ${chainName}` : "på betalingsnettverket");

export const MESSAGES: HomeMessages = {
  headline: channels => `Health factor-varsler for Aave og Morpho via ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Varsler via ${channels} når health factor på Aave eller Morpho er under terskelen din, på ${nbNetworks(networks)}, ${nbEveryMinutes(minutes)}.`
      : `Varsler via ${channels} når health factor på Aave eller Morpho faller under terskelen din, på ${nbNetworks(networks)}. Sjekkes ${nbEveryMinutes(minutes)}.`,
  channelBadge: capitalize,
  pricingCta: plan =>
    plan ? `Sett opp varsler: ${formatDecimal("nb", plan.priceLabel)} for ${nbDays(plan.days)}` : "Sett opp varsler",
  offerDescription: ({ days, currency }) =>
    `Health factor-varsler i ${nbDays(days)}, betalt i ${currency} fra lommeboken din. Ingen automatisk fornyelse.`,

  kicker: "Aave V3 og V4, Morpho Blue og Midnight",
  heroLead: ({ minutes, channels }) =>
    `Sjekkes ${nbEveryMinutes(minutes)}. En melding via ${channels} så lenge du er under grensen din. Kun lesing, ingen godkjenninger.`,
  networksLabel: "Nettverk",
  heroCoverage: networks => nbNetworks(networks),
  channelsLabel: "Varsler via:",
  exampleAlertLabel: "Hva et varsel sier",
  exampleAlertCaption: subject => `Eksempel. E-postene kommer med emnet «${subject}».`,

  dashboardCta: "Åpne oversikten for Aave",
  morphoDashboardCta: "Åpne oversikten for Morpho",
  dashboardCtaMicrocopy: alertPrice => `Koble til en lommebok og se alle posisjonene. Varsler koster ${alertPrice}.`,

  problemTitle: "Health factor faller mens du sover",
  problemLead:
    "Aave viser health factor, men sender ingen varsler (oktober 2026). Tre ting får den til å bevege seg i løpet av natten:",
  problemCauses: [
    { title: "Prisene faller", body: "ETH faller, og sikkerheten din blir mindre verdt." },
    { title: "Renten påløper", body: "Gjelden din vokser hvert sekund." },
    { title: "Terskler endres", body: "På Aave kan governance senke en likvidasjonsterskel." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Låntakere forteller om å ",
      morning("våkne opp til en likvidert posisjon"),
      ", om ",
      failedRepays("en time med mislykkede tilbakebetalinger"),
      " og om ",
      polygon("en tilbakebetaling ved 1,01 som kom for sent"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "Likvidatoren beholder i tillegg en bonus: 5 % på WETH i Core-markedet på Ethereum (oktober 2026).",
      guide && rich(" Les ", guide("hvordan en likvidasjon foregår"), "."),
    ),
  chart: {
    threshold: "terskelen din",
    liquidation: "likvidasjon",
    alertSent: "Varsel sendt",
    youCheck: "Du ser på telefonen",
    caption:
      "En eksempelnatt. Varselet sendes kl. 03.05, ved den første sjekken under 1,5, fem timer før du ser på telefonen.",
  },

  howItWorksTitle: "Slik fungerer det",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` på ${paymentChain}` : "";
    return [
      {
        title: "Koble til lommeboken du låner med",
        body: "Kun lesing. Aave og Morpho, én side hver.",
      },
      {
        title: plan
          ? `Lås opp varsler for ${formatDecimal("nb", plan.priceLabel)}`
          : "Lås opp varsler med en liten betaling i USDC",
        body: `${plan ? `${nbDays(plan.days)} tilgang, betalt` : "Betalt"} i USDC${paidOn}. Ingen automatisk fornyelse.`,
      },
      {
        title: "Velg en grense for hvert marked",
        body: `Fra ${formatDecimal("nb", threshold.min)} (${formatDecimal("nb", morphoMin)} på Morpho) til ${formatDecimal("nb", threshold.max)}, standard ${formatDecimal("nb", threshold.default)}.`,
      },
      {
        title: "Få meldinger så lenge du er under den",
        body: `${capitalize(nbEveryMinutes(minutes))}, via ${channels}, til du er over grensen din igjen.`,
      },
    ];
  },
  scaleTitle: "Hvor du bør legge grensen",
  scale: {
    liquidation: "likvidasjon",
    critical: "Kritisk",
    risky: "Risikabel",
    safe: "Trygg",
    defaultThreshold: value => `Standard ${value}`,
    below: value => `Under ${value}`,
    between: (from, to) => `${from} til ${to}`,
    andAbove: value => `${value} og høyere`,
    range: (min, max) => `Hvilken som helst verdi fra ${min} til ${max}.`,
  },
  scaleGuide: "Slik velger du en terskel",

  coverageTitle: "Hvert marked på Aave og hvert oppført marked på Morpho",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${nbV3Markets(v3Markets)} på Aave på ${nbNetworks(v3Networks)} og ${nbV4Spokes(spokes)} på Aave på ${nbNetworks(v4Networks)}, per 4. november 2026, pluss hvert oppført marked på Morpho på ${nbNetworks(morphoNetworks)}.`,
  coverage: {
    v3Markets: count => nbV3Markets(count),
    v4Spokes: count => nbV4Spokes(count),
    morpho: "Morpho",
  },
  coverageNote:
    "Scroll, ZKsync, Metis, Soneium og Sonic avvikles av Aaves governance og overvåkes fortsatt. Dekkes ikke: Aave V3 på Harmony, ikke-oppførte markeder på Morpho og andre protokoller.",

  pricingTitle: "Priser",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Varsler", detail: capitalize(alertPrice) },
    { term: "Fornyelse", detail: "Ikke automatisk: betal igjen når du vil ha mer tid" },
    {
      term: "Betaling",
      detail: paymentChain
        ? `USDC på ${paymentChain}, fra lommeboken din (godkjenn, deretter betal)`
        : "USDC, fra lommeboken din",
    },
  ],
  priceSource: "Prisen leses fra betalingskontrakten og oppdateres hver time.",
  pricingFootnote: "Å se posisjonene dine krever ingen betaling.",

  questionsTitle: "Spørsmål du bør stille før du kobler til en lommebok",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = nbOnChain(paymentChain);
    return [
      {
        question: "Kan Tokenping røre midlene mine?",
        answer: rich(
          `Nei. Tokenping leser bare posisjonene dine og ber aldri om en godkjenning eller en signatur på Aave eller Morpho. De eneste transaksjonene er betalingen ${onChain}: en godkjenning for nøyaktig prisen, deretter betalingen. `,
          links.sourcify
            ? rich(
                "Kontrakten er ",
                links.sourcify("verifisert på Sourcify"),
                ", og ",
                links.sourceCode("kildekoden er åpen"),
              )
            : links.sourceCode("Kontraktens kildekode er åpen"),
          "; teamets lommebok kan endre prisen, sette kontrakten på pause og oppgradere den.",
        ),
      },
      {
        question: "Hva lagrer Tokenping?",
        answer: rich(
          "Lommebokadressen din, varslene dine og kontaktopplysningene du oppgir (e-post, brukernavn på Signal",
          hasTelegram ? ", Telegram-chat" : "",
          `). Ingen historikk og ingen sporingscookies; sidevisninger telles anonymt. Bare den som kan signere med lommeboken din, kan lese kontaktopplysningene, men betalinger er offentlige ${onChain}. `,
          links.privacy("Personvernsiden"),
          " har hele listen.",
        ),
      },
      {
        question: "Hva koster det?",
        answer: rich(
          `Varsler koster ${alertPrice}, i USDC ${onChain}, pluss litt ETH til gas. Å se posisjonene dine krever ingen betaling. Ingen automatisk fornyelse, ingen refusjon.`,
        ),
      },
      {
        question: "Hvilke lån på Morpho dekkes?",
        answer: rich(
          `Lån på Morpho Blue (flytende rente) og Morpho Midnight (fast rente) i markeder som Morpho-appen viser, med terskler fra ${formatDecimal("nb", morphoMin)}. Et lån med fast rente får også påminnelser før forfallsdatoen. Samme plan dekker dem: åpne `,
          links.morphoDashboard("oversikten for Morpho"),
          ".",
        ),
      },
      {
        question: "Hva om et varsel ikke kommer fram?",
        answer: rich(
          `Neste sjekk, ${plural("nb", minutes, { one: "1 minutt", other: `${minutes} minutter` })} senere, prøver igjen. Leveringen er avhengig av Resend, et Signal-relé,`,
          hasTelegram ? " Telegram Bot API," : "",
          " offentlige RPC-noder og Vercels planlegger, uten garanti for oppetid. Velg to kanaler og gi deg selv rom til å handle.",
        ),
      },
      {
        question: "Hvordan stopper jeg varslene?",
        answer: rich(
          "De stopper når health factor er over grensen din igjen, eller når du sletter varselet (det krever aktiv tilgang). Har tilgangen utløpt? Skriv til oss på ",
          links.x("X"),
          " eller i fellesskapet vårt på ",
          links.telegramCommunity("Telegram"),
          " eller ",
          links.signalCommunity("Signal"),
          ".",
          hasTelegram ? " I Telegram fungerer /stop også." : "",
          " Ingen slumrefunksjon og ingen avmeldingslenke ennå.",
        ),
      },
      {
        question: "Kan jeg overvåke en lommebok jeg ikke kobler til?",
        answer: rich("Ikke i dag. Én lommebok, den du kobler til; tilgangen gjelder per lommebok."),
      },
      {
        question: "Andre verktøy koster ingenting. Hvorfor betale?",
        answer: rich(
          "Hvis en Telegram-bot eller en mobilapp passer deg bedre, bruk en slik",
          links.comparison ? rich(": ", links.comparison("sammenligningen vår"), " går gjennom dem") : null,
          ". Tokenping er laget for varsler via Signal eller e-post, i hvert marked på Aave og hvert oppført marked på Morpho.",
        ),
      },
    ];
  },

  limitsTitle: "Begrensninger, rett fram",
  limits: ({ minutes, paymentChain }) => [
    `Sjekkes ${nbEveryMinutes(minutes)}, ikke fortløpende.`,
    "Hver sjekk under grensen din sender en ny melding: ingen slumring eller sammendrag.",
    "Én grense per marked, bare for den tilkoblede lommeboken.",
    `Bare USDC${paymentChain ? ` på ${paymentChain}` : ""}: ingen kort, ingen refusjon.`,
    "Ingen avmeldingslenke i e-post ennå; å slette et varsel krever aktiv tilgang.",
    "Beta: levering via tredjeparter, ingen garanti for oppetid.",
  ],

  blogTitle: "Fra bloggen",
  allGuides: "Alle guider om Aave og Morpho",

  closingTitle: "Sett opp health factor-varselet ditt for Aave eller Morpho",
  closingLead: alertPrice => `${capitalize(alertPrice)}, betalt fra lommeboken din. Ingen automatisk fornyelse.`,
};
