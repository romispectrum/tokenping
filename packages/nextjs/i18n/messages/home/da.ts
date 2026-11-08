import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal, plural } from "~~/i18n/format";

/** "30 dage", "1 dag". */
const daDays = (days: number) => plural("da", days, { one: `${days} dag`, other: `${days} dage` });

/** "hvert 5. minut", "hvert minut". */
const daEveryMinutes = (minutes: number) =>
  plural("da", minutes, { one: "hvert minut", other: `hvert ${minutes}. minut` });

/** "29 netværk", "1 netværk": the same form in both. */
const daNetworks = (networks: number) => `${networks} netværk`;

/** "24 V3-markeder", "1 V3-marked". */
const daV3Markets = (markets: number) =>
  plural("da", markets, { one: `${markets} V3-marked`, other: `${markets} V3-markeder` });

/** "13 V4-Spokes", "1 V4-Spoke". */
const daV4Spokes = (spokes: number) =>
  plural("da", spokes, { one: `${spokes} V4-Spoke`, other: `${spokes} V4-Spokes` });

/** "på Arbitrum One", or the payment network unnamed. */
const daOnChain = (chainName: string | undefined) => (chainName ? `på ${chainName}` : "på betalingsnetværket");

export const MESSAGES: HomeMessages = {
  headline: channels => `Health factor-alarmer for Aave og Morpho via ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Alarmer via ${channels}, når din health factor på Aave eller Morpho er under din tærskel, på ${daNetworks(networks)}, ${daEveryMinutes(minutes)}.`
      : `Alarmer via ${channels}, når din health factor på Aave eller Morpho falder under din tærskel, på ${daNetworks(networks)}. Tjek ${daEveryMinutes(minutes)}.`,
  channelBadge: capitalize,
  pricingCta: plan =>
    plan ? `Opsæt alarmer: ${formatDecimal("da", plan.priceLabel)} for ${daDays(plan.days)}` : "Opsæt alarmer",
  offerDescription: ({ days, currency }) =>
    `Health factor-alarmer i ${daDays(days)}, betalt i ${currency} fra din wallet. Ingen automatisk fornyelse.`,

  kicker: "Aave V3 og V4, Morpho Blue og Midnight",
  heroLead: ({ minutes, channels }) =>
    `Tjek ${daEveryMinutes(minutes)}. En besked via ${channels}, så længe du ligger under din grænse. Kun læsning, ingen godkendelser.`,
  networksLabel: "Netværk",
  heroCoverage: networks => daNetworks(networks),
  channelsLabel: "Alarmer via:",
  exampleAlertLabel: "Hvad en alarm siger",
  exampleAlertCaption: subject => `Eksempel. E-mails kommer med emnet »${subject}«.`,

  dashboardCta: "Åbn oversigten for Aave",
  morphoDashboardCta: "Åbn oversigten for Morpho",
  dashboardCtaMicrocopy: alertPrice => `Forbind en wallet, og se alle positioner. Alarmer koster ${alertPrice}.`,

  problemTitle: "Din health factor falder, mens du sover",
  problemLead:
    "Aave viser din health factor, men sender ingen alarmer (oktober 2026). Tre ting får den til at bevæge sig i løbet af natten:",
  problemCauses: [
    { title: "Priserne falder", body: "ETH falder, og din sikkerhed bliver mindre værd." },
    { title: "Renten løber på", body: "Din gæld vokser hvert sekund." },
    { title: "Tærskler ændres", body: "På Aave kan governance sænke en likvidationstærskel." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Låntagere fortæller om at ",
      morning("vågne op til en likvideret position"),
      ", om ",
      failedRepays("en time med mislykkede tilbagebetalinger"),
      " og om ",
      polygon("en tilbagebetaling ved 1,01, der kom for sent"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "Likvidatoren beholder desuden en bonus: 5 % på WETH i Core-markedet på Ethereum (oktober 2026).",
      guide && rich(" Læs, ", guide("hvordan en likvidation foregår"), "."),
    ),
  chart: {
    threshold: "din tærskel",
    liquidation: "likvidation",
    alertSent: "Alarm sendt",
    youCheck: "Du kigger på telefonen",
    caption: "En nat som eksempel. Alarmen sendes kl. 03.05, ved det første tjek under 1,5, fem timer før du kigger.",
  },

  howItWorksTitle: "Sådan fungerer det",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` på ${paymentChain}` : "";
    return [
      {
        title: "Forbind den wallet, du låner med",
        body: "Kun læsning. Aave og Morpho, en side til hver.",
      },
      {
        title: plan
          ? `Lås alarmer op for ${formatDecimal("da", plan.priceLabel)}`
          : "Lås alarmer op med en lille betaling i USDC",
        body: `${plan ? `${daDays(plan.days)} adgang, betalt` : "Betalt"} i USDC${paidOn}. Ingen automatisk fornyelse.`,
      },
      {
        title: "Vælg en grænse for hvert marked",
        body: `Fra ${formatDecimal("da", threshold.min)} (${formatDecimal("da", morphoMin)} på Morpho) til ${formatDecimal("da", threshold.max)}, standard ${formatDecimal("da", threshold.default)}.`,
      },
      {
        title: "Få beskeder, så længe du ligger under den",
        body: `${capitalize(daEveryMinutes(minutes))}, via ${channels}, indtil du er over din grænse igen.`,
      },
    ];
  },
  scaleTitle: "Hvor du skal lægge din grænse",
  scale: {
    liquidation: "likvidation",
    critical: "Kritisk",
    risky: "Risikabel",
    safe: "Sikker",
    defaultThreshold: value => `Standard ${value}`,
    below: value => `Under ${value}`,
    between: (from, to) => `${from} til ${to}`,
    andAbove: value => `${value} og derover`,
    range: (min, max) => `Enhver værdi fra ${min} til ${max}.`,
  },
  scaleGuide: "Sådan vælger du en tærskel",

  coverageTitle: "Hvert marked på Aave og hvert listet marked på Morpho",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${daV3Markets(v3Markets)} på Aave på ${daNetworks(v3Networks)} og ${daV4Spokes(spokes)} på Aave på ${daNetworks(v4Networks)} pr. 4. november 2026 samt hvert listet marked på Morpho på ${daNetworks(morphoNetworks)}.`,
  coverage: {
    v3Markets: count => daV3Markets(count),
    v4Spokes: count => daV4Spokes(count),
    morpho: "Morpho",
  },
  coverageNote:
    "Scroll, ZKsync, Metis, Soneium og Sonic er ved at blive afviklet af Aaves governance og overvåges stadig. Dækkes ikke: Aave V3 på Harmony, ikke-listede markeder på Morpho og andre protokoller.",

  pricingTitle: "Priser",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Alarmer", detail: capitalize(alertPrice) },
    { term: "Fornyelse", detail: "Ikke automatisk: betal igen, når du vil have mere tid" },
    {
      term: "Betaling",
      detail: paymentChain
        ? `USDC på ${paymentChain}, fra din wallet (godkend, og betal derefter)`
        : "USDC, fra din wallet",
    },
  ],
  priceSource: "Prisen læses fra betalingskontrakten og opdateres hver time.",
  pricingFootnote: "Det kræver ingen betaling at se dine positioner.",

  questionsTitle: "Spørgsmål, du bør stille, før du forbinder en wallet",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = daOnChain(paymentChain);
    return [
      {
        question: "Kan Tokenping røre mine midler?",
        answer: rich(
          `Nej. Tokenping læser kun dine positioner og beder aldrig om en godkendelse eller en signatur på Aave eller Morpho. De eneste transaktioner er betalingen ${onChain}: en godkendelse af præcis prisen og derefter betalingen. `,
          links.sourcify
            ? rich(
                "Kontrakten er ",
                links.sourcify("verificeret på Sourcify"),
                ", og dens ",
                links.sourceCode("kildekode er offentlig"),
              )
            : links.sourceCode("Kontraktens kildekode er offentlig"),
          "; teamets wallet kan ændre prisen, sætte kontrakten på pause og opgradere den.",
        ),
      },
      {
        question: "Hvad gemmer Tokenping?",
        answer: rich(
          "Din wallet-adresse, dine alarmer og de kontaktoplysninger, du angiver (e-mail, brugernavn på Signal",
          hasTelegram ? ", Telegram-chat" : "",
          `). Ingen historik og ingen sporingscookies; sidevisninger tælles anonymt. Kun den, der kan signere med din wallet, kan læse kontaktoplysningerne, men betalinger er offentlige ${onChain}. `,
          links.privacy("Siden om privatliv"),
          " har hele listen.",
        ),
      },
      {
        question: "Hvad koster det?",
        answer: rich(
          `Alarmer koster ${alertPrice}, i USDC ${onChain}, plus lidt ETH til gas. Det kræver ingen betaling at se dine positioner. Ingen automatisk fornyelse, ingen refusion.`,
        ),
      },
      {
        question: "Hvilke lån på Morpho er dækket?",
        answer: rich(
          `Lån på Morpho Blue (variabel rente) og Morpho Midnight (fast rente) i markeder, som Morpho-appen viser, med tærskler fra ${formatDecimal("da", morphoMin)}. Et lån med fast rente får også påmindelser før forfaldsdatoen. Samme plan dækker dem: åbn `,
          links.morphoDashboard("oversigten for Morpho"),
          ".",
        ),
      },
      {
        question: "Hvad sker der, hvis en alarm ikke kommer frem?",
        answer: rich(
          `Det næste tjek, ${plural("da", minutes, { one: "1 minut", other: `${minutes} minutter` })} senere, prøver igen. Leveringen afhænger af Resend, et Signal-relæ,`,
          hasTelegram ? " Telegram Bot API," : "",
          " offentlige RPC-noder og Vercels planlægger, uden garanti for oppetid. Vælg to kanaler, og giv dig selv tid til at handle.",
        ),
      },
      {
        question: "Hvordan stopper jeg alarmerne?",
        answer: rich(
          "Alarmerne stopper, når din health factor er over din grænse igen, eller når du sletter alarmen (det kræver aktiv adgang). Er din adgang udløbet? Skriv til os på ",
          links.x("X"),
          " eller i vores fællesskab på ",
          links.telegramCommunity("Telegram"),
          " eller ",
          links.signalCommunity("Signal"),
          ".",
          hasTelegram ? " I Telegram virker /stop også." : "",
          " Ingen snooze-funktion og intet afmeldingslink endnu.",
        ),
      },
      {
        question: "Kan jeg overvåge en wallet, som jeg ikke forbinder?",
        answer: rich("Ikke i dag. Én wallet, den du forbinder; adgangen gælder pr. wallet."),
      },
      {
        question: "Andre værktøjer koster ikke noget. Hvorfor betale?",
        answer: rich(
          "Hvis en Telegram-bot eller en mobilapp passer dig bedre, så brug en af dem",
          links.comparison ? rich(": ", links.comparison("vores sammenligning"), " gennemgår dem") : null,
          ". Tokenping er til alarmer via Signal eller e-mail, i hvert marked på Aave og hvert listet marked på Morpho.",
        ),
      },
    ];
  },

  limitsTitle: "Begrænsninger, sagt ligeud",
  limits: ({ minutes, paymentChain, repeatMinutes }) => [
    `Tjek ${daEveryMinutes(minutes)}, ikke løbende.`,
    `Under din grænse får du en besked hvert ${repeatMinutes}. minut: ingen snooze eller opsummering.`,
    "Én grænse pr. marked, kun for den forbundne wallet.",
    `Kun USDC${paymentChain ? ` på ${paymentChain}` : ""}: ingen kort, ingen refusion.`,
    "Intet afmeldingslink i e-mails endnu; det kræver aktiv adgang at slette en alarm.",
    "Beta: levering via tredjeparter, ingen garanti for oppetid.",
  ],

  blogTitle: "Fra bloggen",
  allGuides: "Alle guider om Aave og Morpho",

  closingTitle: "Opsæt din health factor-alarm for Aave eller Morpho",
  closingLead: alertPrice => `${capitalize(alertPrice)}, betalt fra din wallet. Ingen automatisk fornyelse.`,
};
