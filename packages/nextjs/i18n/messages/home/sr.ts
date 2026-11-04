import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal, hrSrChannelsGenitive, plural, srOnMarket } from "~~/i18n/format";
import type { AlertPlan } from "~~/services/marketing/alertPlan";

// The alert price ("3 USDC za 30 dana" or the blog's fallback) always stands where the nominative reads correctly:
// "Cena upozorenja: ...", never after "košta". A network's name follows "na mreži", so it needs no case ending.
// Aave and Morpho stand where they need no ending either: "na protokolu Aave", "Aave i Morpho upozorenja".

/** "1 dan", "2 dana", "30 dana", "21 dan". */
const srDays = (days: number) => plural("sr", days, { one: `${days} dan`, few: `${days} dana`, other: `${days} dana` });

/** "svakih 5 minuta", "svaka 2 minuta", "svakog minuta" (minut is masculine in Serbian). */
const srEveryMinutes = (minutes: number) =>
  minutes === 1
    ? "svakog minuta"
    : plural("sr", minutes, {
        one: `svaki ${minutes} minut`,
        few: `svaka ${minutes} minuta`,
        other: `svakih ${formatDecimal("sr", minutes)} minuta`,
      });

/** "5 minuta", "2 minuta", "1 minut". */
const srMinutes = (minutes: number) =>
  plural("sr", minutes, { one: `${minutes} minut`, few: `${minutes} minuta`, other: `${minutes} minuta` });

const srPrice = (plan: AlertPlan) => `${formatDecimal("sr", plan.priceLabel)} za ${srDays(plan.days)}`;

/** "na 29 mreža", "na 22 mreže", "na 21 mreži". */
const srOnNetworks = (networks: number) =>
  plural("sr", networks, { one: `na ${networks} mreži`, few: `na ${networks} mreže`, other: `na ${networks} mreža` });

/** "1 mreža", "2 mreže", "29 mreža". */
const srNetworks = (networks: number) =>
  plural("sr", networks, { one: `${networks} mreža`, few: `${networks} mreže`, other: `${networks} mreža` });

/** "1 tržište", "2 tržišta", "24 tržišta". */
const srMarkets = (markets: number) =>
  plural("sr", markets, { one: `${markets} tržište`, few: `${markets} tržišta`, other: `${markets} tržišta` });

/** "1 Spoke", "2 Spoke-a", "13 Spoke-ova". */
const srSpokes = (spokes: number) =>
  plural("sr", spokes, { one: `${spokes} Spoke`, few: `${spokes} Spoke-a`, other: `${spokes} Spoke-ova` });

/** "na mreži Arbitrum One", or the payment network unnamed. */
const srOnChain = (chainName: string | undefined) =>
  chainName ? srOnMarket(chainName, "network") : "na mreži za plaćanje";

export const MESSAGES: HomeMessages = {
  headline: channels => `Aave i Morpho upozorenja za health factor putem ${hrSrChannelsGenitive(channels)}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Upozorenja putem ${hrSrChannelsGenitive(channels)} kad je tvoj Aave ili Morpho health factor ispod praga, ${srOnNetworks(networks)}, ${srEveryMinutes(minutes)}.`
      : `Upozorenja putem ${hrSrChannelsGenitive(channels)} kad tvoj Aave ili Morpho health factor padne ispod tvog praga, ${srOnNetworks(networks)}. Provera ${srEveryMinutes(minutes)}.`,
  channelBadge: capitalize,
  pricingCta: plan => (plan ? `Podesi upozorenja: ${srPrice(plan)}` : "Podesi upozorenja"),
  offerDescription: ({ days, currency }) =>
    `Upozorenja za health factor na ${srDays(days)}, plaćena u ${currency} iz tvog novčanika. Bez automatskog obnavljanja.`,

  kicker: "Aave V3 i V4, Morpho Blue i Midnight",
  heroLead: ({ minutes, channels }) =>
    `Provera ${srEveryMinutes(minutes)}. Poruka putem ${hrSrChannelsGenitive(channels)} dok si ispod svoje granice. Samo za čitanje, bez odobrenja tokena.`,
  networksLabel: "Mreže",
  heroCoverage: networks => srNetworks(networks),
  channelsLabel: "Upozorenja putem:",
  exampleAlertLabel: "Šta piše u upozorenju",
  exampleAlertCaption: subject => `Primer. Poruke e-pošte stižu sa naslovom „${subject}“.`,

  dashboardCta: "Otvori kontrolnu tablu za Aave",
  morphoDashboardCta: "Otvori kontrolnu tablu za Morpho",
  dashboardCtaMicrocopy: alertPrice => `Poveži novčanik i vidi sve pozicije. Cena upozorenja: ${alertPrice}.`,

  problemTitle: "Health factor pada dok spavaš",
  problemLead:
    "Aave prikazuje tvoj health factor, ali ne šalje upozorenja (oktobar 2026.). Preko noći ga pomeraju tri stvari:",
  problemCauses: [
    { title: "Cene padaju", body: "ETH pojeftini i tvoj kolateral vredi manje." },
    { title: "Kamata raste", body: "Tvoj dug raste svake sekunde." },
    { title: "Pragovi se menjaju", body: "Na protokolu Aave governance može da smanji prag likvidacije." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Dužnici opisuju ",
      morning("buđenje uz likvidiranu poziciju"),
      ", ",
      failedRepays("sat vremena neuspelih transakcija otplate"),
      " i ",
      polygon("otplatu pri 1,01 koja je stigla prekasno"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "Likvidator povrh toga zadržava bonus: 5% na WETH na tržištu Ethereum Core (oktobar 2026.).",
      guide && rich(" Pogledaj ", guide("kako funkcioniše likvidacija"), "."),
    ),
  chart: {
    threshold: "tvoj prag",
    liquidation: "likvidacija",
    alertSent: "Upozorenje poslato",
    youCheck: "Proveravaš telefon",
    caption:
      "Primer jedne noći. Upozorenje odlazi u 03:05, pri prvoj proveri ispod 1,5, pet sati pre nego što pogledaš.",
  },

  howItWorksTitle: "Kako to radi",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` ${srOnMarket(paymentChain, "network")}` : "";
    return [
      {
        title: "Poveži novčanik kojim se zadužuješ",
        body: "Samo za čitanje. Aave i Morpho, svaki na svojoj stranici.",
      },
      {
        title: plan
          ? `Otključaj upozorenja za ${formatDecimal("sr", plan.priceLabel)}`
          : "Otključaj upozorenja malim plaćanjem u USDC",
        body: `${plan ? `Pristup na ${srDays(plan.days)}, plaćanje` : "Plaćanje"} u USDC${paidOn}. Bez automatskog obnavljanja.`,
      },
      {
        title: "Izaberi granicu za svako tržište",
        body: `Od ${formatDecimal("sr", threshold.min)} (na protokolu Morpho od ${formatDecimal("sr", morphoMin)}) do ${formatDecimal("sr", threshold.max)}, podrazumevano ${formatDecimal("sr", threshold.default)}.`,
      },
      {
        title: "Primaj poruke dok si ispod nje",
        body: `${capitalize(srEveryMinutes(minutes))}, putem ${hrSrChannelsGenitive(channels)}, dok se ne vratiš iznad svoje granice.`,
      },
    ];
  },
  scaleTitle: "Gde da postaviš granicu",
  scale: {
    liquidation: "likvidacija",
    critical: "Kritično",
    risky: "Rizično",
    safe: "Bezbedno",
    defaultThreshold: value => `Podrazumevano ${value}`,
    below: value => `Ispod ${value}`,
    between: (from, to) => `Od ${from} do ${to}`,
    andAbove: value => `${value} i više`,
    range: (min, max) => `Bilo koja vrednost od ${min} do ${max}.`,
  },
  scaleGuide: "Kako da izabereš prag",

  coverageTitle: "Svako Aave tržište i svako navedeno Morpho tržište",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `Aave V3: ${srMarkets(v3Markets)} ${srOnNetworks(v3Networks)}; Aave V4: ${srSpokes(spokes)} ${srOnNetworks(v4Networks)}, stanje na dan 16. oktobra 2026. Uz to svako navedeno Morpho tržište ${srOnNetworks(morphoNetworks)}.`,
  coverage: {
    v3Markets: count => `V3: ${srMarkets(count)}`,
    v4Spokes: count => `V4: ${srSpokes(count)}`,
    morpho: "Morpho",
  },
  coverageNote:
    "Tržišta na mrežama Scroll, ZKsync, Metis, Soneium i Sonic Aave governance postepeno gasi, a mi ih i dalje pratimo. Nisu obuhvaćeni: Aave V3 na mreži Harmony, Morpho tržišta koja nisu navedena i drugi protokoli.",

  pricingTitle: "Cene",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Upozorenja", detail: capitalize(alertPrice) },
    { term: "Obnova", detail: "Ništa se ne obnavlja automatski: plati ponovo kad želiš još vremena" },
    {
      term: "Plaćanje",
      detail: paymentChain
        ? `USDC ${srOnMarket(paymentChain, "network")}, iz tvog novčanika (odobrenje, zatim plaćanje)`
        : "USDC, iz tvog novčanika",
    },
  ],
  priceSource: "Cena se čita iz ugovora za plaćanje i osvežava se svakog sata.",
  pricingFootnote: "Pregled pozicija ne košta ništa.",

  questionsTitle: "Pitanja koja vredi postaviti pre povezivanja novčanika",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = srOnChain(paymentChain);
    return [
      {
        question: "Da li Tokenping može da dira moja sredstva?",
        answer: rich(
          `Ne. Tokenping samo čita tvoje pozicije i nikad ne traži odobrenje ni potpis na protokolima Aave i Morpho. Jedine transakcije su plaćanje ${onChain}: odobrenje za tačno taj iznos, zatim plaćanje. `,
          links.sourcify
            ? rich(
                "Ugovor je ",
                links.sourcify("verifikovan na servisu Sourcify"),
                ", a njegov ",
                links.sourceCode("izvorni kod je javan"),
              )
            : links.sourceCode("Izvorni kod ugovora je javan"),
          "; novčanik tima može da mu promeni cenu, pauzira ga i nadogradi.",
        ),
      },
      {
        question: "Šta Tokenping čuva?",
        answer: rich(
          "Adresu tvog novčanika, tvoja upozorenja i kontakt podatke koje uneseš (e-pošta, korisničko ime na Signalu",
          hasTelegram ? ", razgovor na Telegramu" : "",
          `). Bez istorije i bez kolačića za praćenje; pregledi stranica se broje anonimno. Te kontakt podatke može da pročita samo neko ko može da potpisuje tvojim novčanikom, ali plaćanja ${onChain} su javna. Potpun spisak se nalazi na `,
          links.privacy("stranici o privatnosti"),
          ".",
        ),
      },
      {
        question: "Koliko to košta?",
        answer: rich(
          `Cena upozorenja: ${alertPrice}, u USDC ${onChain}, plus malo ETH za gas. Pregled pozicija ne košta ništa. Bez automatskog obnavljanja, bez povraćaja novca.`,
        ),
      },
      {
        question: "Koji Morpho zajmovi su obuhvaćeni?",
        answer: rich(
          `Zajmovi na protokolima Morpho Blue (promenljiva kamata) i Morpho Midnight (fiksna kamata) na tržištima koja navodi aplikacija Morpho, sa pragovima od ${formatDecimal("sr", morphoMin)}. Zajam s fiksnom kamatom dobija i podsetnike pre dospeća. Pokriva ih isti plan: otvori `,
          links.morphoDashboard("kontrolnu tablu za Morpho"),
          ".",
        ),
      },
      {
        question: "Šta ako upozorenje ne stigne?",
        answer: rich(
          `Sledeća provera, ${srMinutes(minutes)} kasnije, pokušava ponovo. Dostava zavisi od servisa Resend, posrednika za Signal, `,
          hasTelegram ? "servisa Telegram Bot API, " : "",
          "javnih RPC čvorova i Vercel planera zadataka, bez garancije dostupnosti. Izaberi dva kanala i ostavi sebi vremena da reaguješ.",
        ),
      },
      {
        question: "Kako da zaustaviš upozorenja?",
        answer: rich(
          "Prestaju kad se tvoj health factor vrati iznad tvoje granice ili kad obrišeš upozorenje (za to je potreban aktivan pristup). Pristup je istekao? Piši nam na ",
          links.x("X-u"),
          " ili u našoj zajednici na ",
          links.telegramCommunity("Telegramu"),
          " ili ",
          links.signalCommunity("Signalu"),
          ".",
          hasTelegram ? " Na Telegramu radi i /stop." : "",
          " Još nema odlaganja upozorenja ni linka za odjavu.",
        ),
      },
      {
        question: "Mogu li da pratim novčanik koji ne povežem?",
        answer: rich("Za sada ne. Jedan novčanik, onaj koji povežeš; pristup važi po novčaniku."),
      },
      {
        question: "Drugi alati ne koštaju ništa. Zašto plaćati?",
        answer: rich(
          "Ako ti odgovara Telegram bot ili mobilna aplikacija, koristi njih",
          links.comparison ? rich(": opisuje ih naše ", links.comparison("poređenje")) : null,
          ". Tokenping je za upozorenja putem Signala ili e-pošte, na svakom Aave tržištu i svakom navedenom Morpho tržištu.",
        ),
      },
    ];
  },

  limitsTitle: "Ograničenja, jasno rečena",
  limits: ({ minutes, paymentChain }) => [
    `Provera ${srEveryMinutes(minutes)}, a ne neprekidno.`,
    "Svaka provera ispod tvoje granice šalje novu poruku: bez odlaganja i bez zbirnih pregleda.",
    "Jedna granica po tržištu, samo za povezani novčanik.",
    `Samo USDC${paymentChain ? ` ${srOnMarket(paymentChain, "network")}` : ""}: bez kartica, bez povraćaja novca.`,
    "Poruke e-pošte još nemaju link za odjavu; brisanje upozorenja zahteva aktivan pristup.",
    "Beta: dostava preko spoljnih servisa, bez garancije dostupnosti.",
  ],

  blogTitle: "Sa bloga",
  allGuides: "Svi vodiči za Aave i Morpho",

  closingTitle: "Podesi Aave ili Morpho upozorenje za health factor",
  closingLead: alertPrice => `${capitalize(alertPrice)}, plaćanje iz tvog novčanika. Bez automatskog obnavljanja.`,
};
