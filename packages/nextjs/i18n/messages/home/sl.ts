import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal, plural } from "~~/i18n/format";
import type { AlertPlan } from "~~/services/marketing/alertPlan";

// The alert price ("3 USDC za 30 dni" or the blog's fallback) always stands where the nominative reads correctly:
// "Cena opozoril: ...", never after "stanejo". The channels ("Signal, Telegram ali e-pošta") stand after a colon or in
// brackets, and a network's name after "omrežje", so no name takes a case ending.

/** "1 dan", "2 dneva", "3 dni", "30 dni". */
const slDays = (days: number) =>
  plural("sl", days, { one: `${days} dan`, two: `${days} dneva`, few: `${days} dni`, other: `${days} dni` });

/** "vsako minuto", "vsaki 2 minuti", "vsake 3 minute", "vsakih 5 minut". */
const slEveryMinutes = (minutes: number) =>
  plural("sl", minutes, {
    one: minutes === 1 ? "vsako minuto" : `vsako ${minutes} minuto`,
    two: `vsaki ${minutes} minuti`,
    few: `vsake ${minutes} minute`,
    other: `vsakih ${formatDecimal("sl", minutes)} minut`,
  });

/** "čez 1 minuto", "čez 2 minuti", "čez 3 minute", "čez 5 minut". */
const slMinutesLater = (minutes: number) =>
  plural("sl", minutes, {
    one: `čez ${minutes} minuto`,
    two: `čez ${minutes} minuti`,
    few: `čez ${minutes} minute`,
    other: `čez ${formatDecimal("sl", minutes)} minut`,
  });

const slPrice = (plan: AlertPlan) => `${formatDecimal("sl", plan.priceLabel)} za ${slDays(plan.days)}`;

/** "na 1 omrežju", "na 29 omrežjih". */
const slOnNetworks = (networks: number) =>
  plural("sl", networks, { one: `na ${networks} omrežju`, other: `na ${networks} omrežjih` });

/** "1 omrežje", "2 omrežji", "3 omrežja", "29 omrežij". */
const slNetworks = (networks: number) =>
  plural("sl", networks, {
    one: `${networks} omrežje`,
    two: `${networks} omrežji`,
    few: `${networks} omrežja`,
    other: `${networks} omrežij`,
  });

/** "1 trg", "2 trga", "3 trgi", "24 trgov". */
const slMarkets = (markets: number) =>
  plural("sl", markets, {
    one: `${markets} trg`,
    two: `${markets} trga`,
    few: `${markets} trgi`,
    other: `${markets} trgov`,
  });

/** "1 trg Spoke", "13 trgov Spoke": Aave's word stays as it is, after the noun. */
const slSpokes = (spokes: number) => `${slMarkets(spokes)} Spoke`;

/** "na omrežju Arbitrum One", or the payment network unnamed. */
const slOnChain = (chainName: string | undefined) => (chainName ? `na omrežju ${chainName}` : "na plačilnem omrežju");

export const MESSAGES: HomeMessages = {
  headline: channels => `Opozorila za health factor v Aave in Morpho: ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Opozorilo, ko je health factor v Aave ali Morpho pod pragom, ${slOnNetworks(networks)}, ${slEveryMinutes(minutes)}. Kanali: ${channels}.`
      : `Opozorilo, ko tvoj health factor v Aave ali Morpho pade pod tvoj prag, ${slOnNetworks(networks)}. Preverjanje ${slEveryMinutes(minutes)}. Kanali: ${channels}.`,
  channelBadge: capitalize,
  pricingCta: plan => (plan ? `Nastavi opozorila: ${slPrice(plan)}` : "Nastavi opozorila"),
  offerDescription: ({ days, currency }) =>
    `Opozorila za health factor za ${slDays(days)}, plačana v ${currency} iz tvoje denarnice. Brez samodejnega podaljšanja.`,

  kicker: "Aave V3 in V4, Morpho Blue in Midnight",
  heroLead: ({ minutes, channels }) =>
    `Preverjanje ${slEveryMinutes(minutes)}. Sporočilo (${channels}), dokler si pod svojim pragom. Samo za branje, brez odobritev.`,
  networksLabel: "Omrežja",
  heroCoverage: networks => slNetworks(networks),
  channelsLabel: "Kanali za opozorila:",
  exampleAlertLabel: "Kaj piše v opozorilu",
  exampleAlertCaption: subject => `Primer. E-poštna sporočila prispejo z zadevo „${subject}“.`,

  dashboardCta: "Odpri nadzorno ploščo Aave",
  morphoDashboardCta: "Odpri nadzorno ploščo Morpho",
  dashboardCtaMicrocopy: alertPrice => `Poveži denarnico in si oglej vse pozicije. Cena opozoril: ${alertPrice}.`,

  problemTitle: "Health factor pada, medtem ko spiš",
  problemLead:
    "Aave prikazuje tvoj health factor, opozoril pa ne pošilja (oktober 2026). Ponoči ga premikajo tri stvari:",
  problemCauses: [
    { title: "Cene padajo", body: "ETH pade in tvoje zavarovanje je vredno manj." },
    { title: "Obresti se nabirajo", body: "Tvoj dolg raste vsako sekundo." },
    { title: "Pragovi se spreminjajo", body: "V Aave lahko governance zniža prag likvidacije." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Posojilojemalci opisujejo ",
      morning("jutro z likvidirano pozicijo"),
      ", ",
      failedRepays("uro neuspelih transakcij za odplačilo"),
      " in ",
      polygon("odplačilo pri 1,01, ki je prišlo prepozno"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "Likvidator povrhu obdrži še bonus: 5 % na WETH na trgu Ethereum Core (oktober 2026).",
      guide && rich(" Preberi, ", guide("kako poteka likvidacija"), "."),
    ),
  chart: {
    threshold: "tvoj prag",
    liquidation: "likvidacija",
    alertSent: "Opozorilo poslano",
    youCheck: "Pogledaš telefon",
    caption: "Primer noči. Opozorilo gre ob 3.05, ob prvem preverjanju pod 1,5, pet ur preden pogledaš na telefon.",
  },

  howItWorksTitle: "Kako deluje",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` na omrežju ${paymentChain}` : "";
    return [
      {
        title: "Poveži denarnico, s katero si izposojaš",
        body: "Samo za branje. Aave in Morpho, vsak na svoji strani.",
      },
      {
        title: plan
          ? `Odkleni opozorila za ${formatDecimal("sl", plan.priceLabel)}`
          : "Odkleni opozorila z majhnim plačilom v USDC",
        body: `${plan ? `${capitalize(slDays(plan.days))}, plačilo` : "Plačilo"} v USDC${paidOn}. Brez samodejnega podaljšanja.`,
      },
      {
        title: "Izberi prag za vsak trg",
        body: `Od ${formatDecimal("sl", threshold.min)} (v Morpho od ${formatDecimal("sl", morphoMin)}) do ${formatDecimal("sl", threshold.max)}, privzeto ${formatDecimal("sl", threshold.default)}.`,
      },
      {
        title: "Prejemaj sporočila, dokler si pod njim",
        body: `${capitalize(slEveryMinutes(minutes))} (${channels}), dokler ne prideš spet nad svoj prag.`,
      },
    ];
  },
  scaleTitle: "Kam postaviti prag",
  scale: {
    liquidation: "likvidacija",
    critical: "Kritično",
    risky: "Tvegano",
    safe: "Varno",
    defaultThreshold: value => `Privzeto ${value}`,
    below: value => `Pod ${value}`,
    between: (from, to) => `Od ${from} do ${to}`,
    andAbove: value => `${value} in več`,
    range: (min, max) => `Katera koli vrednost od ${min} do ${max}.`,
  },
  scaleGuide: "Kako izbrati prag",

  coverageTitle: "Vsi trgi Aave in vsi navedeni trgi Morpho",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${slMarkets(v3Markets)} Aave V3 ${slOnNetworks(v3Networks)} in ${slSpokes(spokes)} Aave V4 ${slOnNetworks(v4Networks)}, po stanju 4. novembra 2026, poleg tega pa vsi navedeni trgi Morpho ${slOnNetworks(morphoNetworks)}.`,
  coverage: {
    v3Markets: count => `${slMarkets(count)} V3`,
    v4Spokes: count => `${slSpokes(count)} V4`,
    morpho: "Morpho",
  },
  coverageNote:
    "Trge na omrežjih Scroll, ZKsync, Metis, Soneium in Sonic governance Aave postopoma zapira, a jih še vedno spremljamo. Ni zajeto: Aave V3 na omrežju Harmony, nenavedeni trgi Morpho in drugi protokoli.",

  pricingTitle: "Cenik",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Opozorila", detail: capitalize(alertPrice) },
    { term: "Podaljšanje", detail: "Ni samodejno: plačaj znova, ko želiš več časa" },
    {
      term: "Plačilo",
      detail: paymentChain
        ? `USDC na omrežju ${paymentChain}, iz tvoje denarnice (odobritev, nato plačilo)`
        : "USDC, iz tvoje denarnice",
    },
  ],
  priceSource: "Cena se bere iz plačilne pogodbe in se osveži vsako uro.",
  pricingFootnote: "Ogled pozicij ne stane ničesar.",

  questionsTitle: "Vprašanja, ki si jih zastavi, preden povežeš denarnico",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = slOnChain(paymentChain);
    return [
      {
        question: "Lahko Tokenping poseže v moja sredstva?",
        answer: rich(
          `Ne. Tokenping samo bere tvoje pozicije in nikoli ne zahteva odobritve ali podpisa v Aave ali Morpho. Edini transakciji sta plačilo ${onChain}: odobritev za točno ta znesek, nato plačilo. `,
          links.sourcify
            ? rich(
                "Pogodba je ",
                links.sourcify("preverjena v Sourcify"),
                ", njena ",
                links.sourceCode("izvorna koda pa je javna"),
              )
            : links.sourceCode("Izvorna koda pogodbe je javna"),
          "; denarnica ekipe ji lahko spremeni ceno, jo ustavi in nadgradi.",
        ),
      },
      {
        question: "Kaj shranjujete?",
        answer: rich(
          "Naslov tvoje denarnice, tvoja opozorila in kontaktne podatke, ki jih vneseš (e-pošta, uporabniško ime Signal",
          hasTelegram ? ", klepet Telegram" : "",
          `). Brez zgodovine in brez sledilnih piškotkov; oglede strani štejemo anonimno. Te kontaktne podatke lahko prebere samo nekdo, ki lahko podpisuje s tvojo denarnico, plačila ${onChain} pa so javna. Celoten seznam je na `,
          links.privacy("strani o zasebnosti"),
          ".",
        ),
      },
      {
        question: "Koliko stane?",
        answer: rich(
          `Cena opozoril: ${alertPrice}, v USDC ${onChain}, poleg tega še nekaj ETH za gas. Ogled pozicij ne stane ničesar. Brez samodejnega podaljšanja, brez vračil.`,
        ),
      },
      {
        question: "Katera posojila v Morpho so zajeta?",
        answer: rich(
          `Posojila v Morpho Blue (spremenljiva obrestna mera) in Morpho Midnight (fiksna obrestna mera) na trgih, ki jih navaja aplikacija Morpho, s pragovi od ${formatDecimal("sl", morphoMin)}. Posojilo s fiksno obrestno mero dobi tudi opomnike pred zapadlostjo. Zajema jih isti paket: odpri `,
          links.morphoDashboard("nadzorno ploščo Morpho"),
          ".",
        ),
      },
      {
        question: "Kaj, če opozorilo ne prispe?",
        answer: rich(
          `Naslednje preverjanje ${slMinutesLater(minutes)} poskusi znova. Dostava je odvisna od storitve Resend, releja Signal, `,
          hasTelegram ? "vmesnika Telegram Bot API, " : "",
          "javnih vozlišč RPC in razporejevalnika Vercel, brez zagotovila razpoložljivosti. Izberi dva kanala in si pusti čas za ukrepanje.",
        ),
      },
      {
        question: "Kako ustavim opozorila?",
        answer: rich(
          "Ustavijo se, ko je tvoj health factor spet nad tvojim pragom, ali ko izbrišeš opozorilo (potreben je aktiven dostop). Dostop je potekel? Piši nam na ",
          links.x("X"),
          " ali v naši skupnosti v aplikaciji ",
          links.telegramCommunity("Telegram"),
          " ali ",
          links.signalCommunity("Signal"),
          ".",
          hasTelegram ? " V aplikaciji Telegram deluje tudi /stop." : "",
          " Začasnega utišanja in povezave za odjavo še ni.",
        ),
      },
      {
        question: "Lahko spremljam denarnico, ki je ne povežem?",
        answer: rich("Zaenkrat ne. Ena denarnica, tista, ki jo povežeš; dostop velja za posamezno denarnico."),
      },
      {
        question: "Druga orodja ne stanejo ničesar. Zakaj plačati?",
        answer: rich(
          "Če ti ustreza bot za Telegram ali mobilna aplikacija, uporabi to",
          links.comparison ? rich(": opisuje jih naša ", links.comparison("primerjava")) : null,
          ". Tokenping je za opozorila v aplikaciji Signal ali po e-pošti, na vseh trgih Aave in vseh navedenih trgih Morpho.",
        ),
      },
    ];
  },

  limitsTitle: "Omejitve, povedane naravnost",
  limits: ({ minutes, paymentChain }) => [
    `Preverjanje ${slEveryMinutes(minutes)}, ne sproti.`,
    "Vsako preverjanje pod tvojim pragom pošlje novo sporočilo: brez utišanja ali povzetka.",
    "En prag na trg, samo za povezano denarnico.",
    `Samo USDC${paymentChain ? ` na omrežju ${paymentChain}` : ""}: brez kartic, brez vračil.`,
    "E-poštna sporočila še nimajo povezave za odjavo; brisanje opozorila zahteva aktiven dostop.",
    "Beta: dostavo izvajajo zunanje storitve, brez zagotovila razpoložljivosti.",
  ],

  blogTitle: "Z bloga",
  allGuides: "Vsi vodniki za Aave in Morpho",

  closingTitle: "Nastavi opozorilo za health factor v Aave ali Morpho",
  closingLead: alertPrice => `${capitalize(alertPrice)}, plačilo iz tvoje denarnice. Brez samodejnega podaljšanja.`,
};
