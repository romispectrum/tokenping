import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal, hrOnMarket, hrSrChannelsGenitive, plural } from "~~/i18n/format";
import type { AlertPlan } from "~~/services/marketing/alertPlan";

// The alert price ("3 USDC za 30 dana" or the blog's fallback) always stands where the nominative reads correctly:
// "Cijena upozorenja: ...", never after "košta". A network's name follows "na mreži", so it
// needs no case ending.

/** "1 dan", "2 dana", "30 dana", "21 dan". */
const hrDays = (days: number) => plural("hr", days, { one: `${days} dan`, few: `${days} dana`, other: `${days} dana` });

/** "svakih 5 minuta", "svake 2 minute", "svake minute". */
const hrEveryMinutes = (minutes: number) =>
  minutes === 1
    ? "svake minute"
    : plural("hr", minutes, {
        one: `svakih ${minutes} minuta`,
        few: `svake ${minutes} minute`,
        other: `svakih ${formatDecimal("hr", minutes)} minuta`,
      });

/** "5 minuta", "2 minute", "1 minutu" (after "za"). */
const hrMinutesLater = (minutes: number) =>
  plural("hr", minutes, { one: `${minutes} minutu`, few: `${minutes} minute`, other: `${minutes} minuta` });

const hrPrice = (plan: AlertPlan) => `${formatDecimal("hr", plan.priceLabel)} za ${hrDays(plan.days)}`;

/** "na 29 mreža", "na 22 mreže", "na 21 mreži". */
const hrOnNetworks = (networks: number) =>
  plural("hr", networks, { one: `na ${networks} mreži`, few: `na ${networks} mreže`, other: `na ${networks} mreža` });

/** "1 mreža", "2 mreže", "29 mreža". */
const hrNetworks = (networks: number) =>
  plural("hr", networks, { one: `${networks} mreža`, few: `${networks} mreže`, other: `${networks} mreža` });

/** "1 tržište", "2 tržišta", "24 tržišta". */
const hrMarkets = (markets: number) =>
  plural("hr", markets, { one: `${markets} tržište`, few: `${markets} tržišta`, other: `${markets} tržišta` });

/** "1 Spoke", "2 Spokea", "13 Spokeova". */
const hrSpokes = (spokes: number) =>
  plural("hr", spokes, { one: `${spokes} Spoke`, few: `${spokes} Spokea`, other: `${spokes} Spokeova` });

/** "na mreži Arbitrum One", or the payment network unnamed. */
const hrOnChain = (chainName: string | undefined) =>
  chainName ? hrOnMarket(chainName, "network") : "na mreži za plaćanje";

export const MESSAGES: HomeMessages = {
  headline: channels => `Upozorenja za health factor na Aaveu i Morphu putem ${hrSrChannelsGenitive(channels)}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Upozorenja putem ${hrSrChannelsGenitive(channels)} kad je health factor na Aaveu ili Morphu ispod tvog praga, ${hrOnNetworks(networks)}, ${hrEveryMinutes(minutes)}.`
      : `Upozorenja putem ${hrSrChannelsGenitive(channels)} kad tvoj health factor na Aaveu ili Morphu padne ispod tvog praga, ${hrOnNetworks(networks)}. Provjera ${hrEveryMinutes(minutes)}.`,
  channelBadge: capitalize,
  pricingCta: plan => (plan ? `Postavi upozorenja: ${hrPrice(plan)}` : "Postavi upozorenja"),
  offerDescription: ({ days, currency }) =>
    `Upozorenja za health factor na ${hrDays(days)}, plaćena u ${currency} iz tvog novčanika. Bez automatskog obnavljanja.`,

  kicker: "Aave V3 i V4, Morpho Blue i Midnight",
  heroLead: ({ minutes, channels }) =>
    `Provjera ${hrEveryMinutes(minutes)}. Poruka putem ${hrSrChannelsGenitive(channels)} dok si ispod svoje granice. Samo za čitanje, bez odobrenja tokena.`,
  networksLabel: "Mreže",
  heroCoverage: networks => hrNetworks(networks),
  channelsLabel: "Upozorenja putem:",
  exampleAlertLabel: "Što piše u upozorenju",
  exampleAlertCaption: subject => `Primjer. E-poruke stižu s naslovom „${subject}“.`,

  dashboardCta: "Otvori nadzornu ploču za Aave",
  morphoDashboardCta: "Otvori nadzornu ploču za Morpho",
  dashboardCtaMicrocopy: alertPrice => `Poveži novčanik i vidi sve pozicije. Cijena upozorenja: ${alertPrice}.`,

  problemTitle: "Health factor pada dok spavaš",
  problemLead:
    "Aave prikazuje tvoj health factor, ali ne šalje upozorenja (listopad 2026.). Preko noći ga pomiču tri stvari:",
  problemCauses: [
    { title: "Cijene padaju", body: "ETH pojeftini i tvoj kolateral vrijedi manje." },
    { title: "Kamata raste", body: "Tvoj dug raste svake sekunde." },
    { title: "Pragovi se mijenjaju", body: "Na Aaveu governance može smanjiti prag likvidacije." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Dužnici opisuju ",
      morning("buđenje uz likvidiranu poziciju"),
      ", ",
      failedRepays("sat vremena neuspjelih transakcija otplate"),
      " i ",
      polygon("otplatu pri 1,01 koja je stigla prekasno"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "Likvidator povrh toga zadržava bonus: 5 % na WETH na tržištu Core na Ethereumu (listopad 2026.).",
      guide && rich(" Pogledaj ", guide("kako funkcionira likvidacija"), "."),
    ),
  chart: {
    threshold: "tvoj prag",
    liquidation: "likvidacija",
    alertSent: "Upozorenje poslano",
    youCheck: "Provjeravaš mobitel",
    caption:
      "Primjer jedne noći. Upozorenje odlazi u 03:05, pri prvoj provjeri ispod 1,5, pet sati prije nego što pogledaš.",
  },

  howItWorksTitle: "Kako to radi",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` ${hrOnMarket(paymentChain, "network")}` : "";
    return [
      {
        title: "Poveži novčanik kojim se zadužuješ",
        body: "Samo za čitanje. Aave i Morpho, svaki na svojoj stranici.",
      },
      {
        title: plan
          ? `Otključaj upozorenja za ${formatDecimal("hr", plan.priceLabel)}`
          : "Otključaj upozorenja malim plaćanjem u USDC-u",
        body: `${plan ? `Pristup na ${hrDays(plan.days)}, plaćanje` : "Plaćanje"} u USDC-u${paidOn}. Bez automatskog obnavljanja.`,
      },
      {
        title: "Odaberi granicu za svako tržište",
        body: `Od ${formatDecimal("hr", threshold.min)} (na Morphu od ${formatDecimal("hr", morphoMin)}) do ${formatDecimal("hr", threshold.max)}, zadano ${formatDecimal("hr", threshold.default)}.`,
      },
      {
        title: "Primaj poruke dok si ispod nje",
        body: `${capitalize(hrEveryMinutes(minutes))}, putem ${hrSrChannelsGenitive(channels)}, dok se ne vratiš iznad svoje granice.`,
      },
    ];
  },
  scaleTitle: "Gdje postaviti granicu",
  scale: {
    liquidation: "likvidacija",
    critical: "Kritično",
    risky: "Rizično",
    safe: "Sigurno",
    defaultThreshold: value => `Zadano ${value}`,
    below: value => `Ispod ${value}`,
    between: (from, to) => `Od ${from} do ${to}`,
    andAbove: value => `${value} i više`,
    range: (min, max) => `Bilo koja vrijednost od ${min} do ${max}.`,
  },
  scaleGuide: "Kako odabrati prag",

  coverageTitle: "Svako tržište na Aaveu i svako navedeno tržište na Morphu",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `Aave V3: ${hrMarkets(v3Markets)} ${hrOnNetworks(v3Networks)}; Aave V4: ${hrSpokes(spokes)} ${hrOnNetworks(v4Networks)}, stanje 4. studenoga 2026. Uz to svako navedeno tržište na Morphu ${hrOnNetworks(morphoNetworks)}.`,
  coverage: {
    v3Markets: count => `V3: ${hrMarkets(count)}`,
    v4Spokes: count => `V4: ${hrSpokes(count)}`,
    morpho: "Morpho",
  },
  coverageNote:
    "Tržišta na mrežama Scroll, ZKsync, Metis, Soneium i Sonic governance Aavea postupno gasi, a mi ih i dalje pratimo. Nisu obuhvaćeni: Aave V3 na mreži Harmony, nenavedena tržišta na Morphu i drugi protokoli.",

  pricingTitle: "Cijene",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Upozorenja", detail: capitalize(alertPrice) },
    { term: "Obnova", detail: "Ništa se ne obnavlja automatski: plati ponovno kad želiš još vremena" },
    {
      term: "Plaćanje",
      detail: paymentChain
        ? `USDC ${hrOnMarket(paymentChain, "network")}, iz tvog novčanika (odobrenje, zatim plaćanje)`
        : "USDC, iz tvog novčanika",
    },
  ],
  priceSource: "Cijena se čita iz ugovora za plaćanje i osvježava svaki sat.",
  pricingFootnote: "Pregled pozicija ne košta ništa.",

  questionsTitle: "Pitanja koja vrijedi postaviti prije povezivanja novčanika",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = hrOnChain(paymentChain);
    return [
      {
        question: "Može li Tokenping dirati moja sredstva?",
        answer: rich(
          `Ne. Tokenping samo čita tvoje pozicije i nikad ne traži odobrenje ni potpis na Aaveu ili Morphu. Jedine transakcije su plaćanje ${onChain}: odobrenje za točno taj iznos, zatim plaćanje. `,
          links.sourcify
            ? rich(
                "Ugovor je ",
                links.sourcify("verificiran na Sourcifyju"),
                ", a njegov ",
                links.sourceCode("izvorni kod je javan"),
              )
            : links.sourceCode("Izvorni kod ugovora je javan"),
          "; novčanik tima može mu promijeniti cijenu, pauzirati ga i nadograditi.",
        ),
      },
      {
        question: "Što Tokenping sprema?",
        answer: rich(
          "Adresu tvog novčanika, tvoja upozorenja i kontaktne podatke koje uneseš (e-pošta, korisničko ime na Signalu",
          hasTelegram ? ", razgovor na Telegramu" : "",
          `). Bez povijesti i bez kolačića za praćenje; posjeti stranicama broje se anonimno. Te kontaktne podatke može pročitati samo netko tko može potpisivati tvojim novčanikom, ali plaćanja ${onChain} su javna. Potpuni popis nalazi se na `,
          links.privacy("stranici o privatnosti"),
          ".",
        ),
      },
      {
        question: "Koliko to košta?",
        answer: rich(
          `Cijena upozorenja: ${alertPrice}, u USDC-u ${onChain}, plus malo ETH-a za gas. Pregled pozicija ne košta ništa. Bez automatskog obnavljanja, bez povrata novca.`,
        ),
      },
      {
        question: "Koji su zajmovi na Morphu obuhvaćeni?",
        answer: rich(
          `Zajmovi na Morphu Blue (promjenjiva kamata) i Morphu Midnight (fiksna kamata) na tržištima koja navodi aplikacija Morpho, s pragovima od ${formatDecimal("hr", morphoMin)}. Zajam s fiksnom kamatom dobiva i podsjetnike prije dospijeća. Pokriva ih isti plan: otvori `,
          links.morphoDashboard("nadzornu ploču za Morpho"),
          ".",
        ),
      },
      {
        question: "Što ako upozorenje ne stigne?",
        answer: rich(
          `Sljedeća provjera, ${hrMinutesLater(minutes)} kasnije, pokušava ponovno. Dostava ovisi o servisu Resend, posredniku za Signal, `,
          hasTelegram ? "Telegram Bot API-ju, " : "",
          "javnim RPC čvorovima i Vercelovu planeru zadataka, bez jamstva dostupnosti. Odaberi dva kanala i ostavi si vremena za reakciju.",
        ),
      },
      {
        question: "Kako zaustaviti upozorenja?",
        answer: rich(
          "Prestaju kad se tvoj health factor vrati iznad tvoje granice ili kad izbrišeš upozorenje (za to treba aktivan pristup). Pristup je istekao? Piši nam na ",
          links.x("X-u"),
          " ili u našoj zajednici na ",
          links.telegramCommunity("Telegramu"),
          " ili ",
          links.signalCommunity("Signalu"),
          ".",
          hasTelegram ? " Na Telegramu radi i /stop." : "",
          " Još nema odgode upozorenja ni poveznice za odjavu.",
        ),
      },
      {
        question: "Mogu li pratiti novčanik koji ne povežem?",
        answer: rich("Zasad ne. Jedan novčanik, onaj koji povežeš; pristup vrijedi po novčaniku."),
      },
      {
        question: "Drugi alati ne koštaju ništa. Zašto plaćati?",
        answer: rich(
          "Ako ti odgovara Telegram bot ili mobilna aplikacija, koristi njih",
          links.comparison ? rich(": opisuje ih naša ", links.comparison("usporedba")) : null,
          ". Tokenping je za upozorenja putem Signala ili e-pošte, na svakom tržištu na Aaveu i svakom navedenom tržištu na Morphu.",
        ),
      },
    ];
  },

  limitsTitle: "Ograničenja, jasno rečena",
  limits: ({ minutes, paymentChain }) => [
    `Provjera ${hrEveryMinutes(minutes)}, a ne neprekidno.`,
    "Svaka provjera ispod tvoje granice šalje novu poruku: bez odgode i bez sažetaka.",
    "Jedna granica po tržištu, samo za povezani novčanik.",
    `Samo USDC${paymentChain ? ` ${hrOnMarket(paymentChain, "network")}` : ""}: bez kartica, bez povrata novca.`,
    "E-poruke još nemaju poveznicu za odjavu; brisanje upozorenja traži aktivan pristup.",
    "Beta: dostava preko vanjskih servisa, bez jamstva dostupnosti.",
  ],

  blogTitle: "S bloga",
  allGuides: "Svi vodiči za Aave i Morpho",

  closingTitle: "Postavi upozorenje za health factor na Aaveu ili Morphu",
  closingLead: alertPrice => `${capitalize(alertPrice)}, plaćanje iz tvog novčanika. Bez automatskog obnavljanja.`,
};
