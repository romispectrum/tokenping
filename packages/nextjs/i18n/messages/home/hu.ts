import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal, huOnMarket } from "~~/i18n/format";

/** "30 nap", "1 nap": Hungarian keeps the noun singular after a number. */
const huDays = (days: number) => `${days} nap`;

// The channels arrive joined ("Signal, Telegram és e-mail") from a fixed set of names (services/marketing/alertChannels),
// so each one gets its own written-out suffix: "Signalon, Telegramon és e-mailben".
const ON_CHANNEL: Record<string, string> = { Signal: "Signalon", Telegram: "Telegramon", "e-mail": "e-mailben" };
const onChannels = (channels: string) => channels.replace(/Signal|Telegram|e-mail/g, name => ON_CHANNEL[name]);

/** "az Arbitrum hálózaton", or the payment network unnamed. */
const onChain = (chainName: string | undefined) =>
  chainName ? huOnMarket(chainName, "network") : "a fizetési hálózaton";

export const MESSAGES: HomeMessages = {
  headline: channels => `Aave és Morpho health factor-riasztások ${onChannels(channels)}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Riasztás ${onChannels(channels)}, ha az Aave vagy Morpho health factorod a küszöböd alatt van. ${networks} hálózat, ${minutes} percenként.`
      : `Riasztás ${onChannels(channels)}, ha az Aave vagy Morpho health factorod a küszöbértéked alá esik, ${networks} hálózaton. Ellenőrzés ${minutes} percenként.`,
  channelBadge: capitalize,
  pricingCta: plan =>
    plan
      ? `Riasztások beállítása: ${formatDecimal("hu", plan.priceLabel)} ${huDays(plan.days)}ra`
      : "Riasztások beállítása",
  offerDescription: ({ days, currency }) =>
    `Health factor-riasztások ${huDays(days)}ra, a tárcádból fizetve (${currency}). Nincs automatikus megújítás.`,

  kicker: "Aave V3 és V4, Morpho Blue és Midnight",
  heroLead: ({ minutes, channels }) =>
    `Ellenőrzés ${minutes} percenként. Üzenet ${onChannels(channels)}, amíg a küszöbértéked alatt vagy. Csak olvasás, jóváhagyások nélkül.`,
  networksLabel: "Hálózatok",
  heroCoverage: networks => `${networks} hálózat`,
  channelsLabel: "Riasztási csatornák:",
  exampleAlertLabel: "Mit ír egy riasztás",
  exampleAlertCaption: subject => `Példa. Az e-mailek „${subject}” tárggyal érkeznek.`,

  dashboardCta: "Az Aave irányítópult megnyitása",
  morphoDashboardCta: "A Morpho irányítópult megnyitása",
  dashboardCtaMicrocopy: alertPrice =>
    `Csatlakoztass egy tárcát, és lásd az összes pozíciódat. A riasztások ára: ${alertPrice}.`,

  problemTitle: "A health factor alvás közben is esik",
  problemLead:
    "Az Aave mutatja a health factorodat, de riasztást nem küld (2026. október). Éjszaka három dolog mozgatja:",
  problemCauses: [
    { title: "Esnek az árak", body: "Az ETH esik, és a fedezeted kevesebbet ér." },
    { title: "Nő a kamat", body: "Az adósságod minden másodpercben nő." },
    { title: "Változnak a küszöbök", body: "Az Aave-on a governance csökkentheti a likvidálási küszöböt." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Hitelfelvevők írnak arról, hogy ",
      morning("likvidált pozícióra ébredtek"),
      ", hogy ",
      failedRepays("egy órán át buktak el a visszafizetési tranzakcióik"),
      ", és ",
      polygon("egy 1,01 értéknél indított visszafizetésről, amely túl későn jött"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "A likvidátor ráadásul bónuszt is megtart: WETH esetén 5%-ot az Ethereum Core piacon (2026. október).",
      guide && rich(" Olvasd el, ", guide("hogyan működik a likvidálás"), "."),
    ),
  chart: {
    threshold: "küszöbértéked",
    liquidation: "likvidálás",
    alertSent: "Riasztás elküldve",
    youCheck: "Ránézel a telefonodra",
    caption:
      "Egy példaéjszaka. A riasztás 03:05-kor megy ki, az első 1,5 alatti ellenőrzéskor, öt órával azelőtt, hogy ránéznél.",
  },

  howItWorksTitle: "Hogyan működik",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` ${huOnMarket(paymentChain, "network")}` : "";
    return [
      {
        title: "Csatlakoztasd a tárcát, amellyel hitelt veszel fel",
        body: "Csak olvasás. Aave és Morpho, mindkettő saját oldallal.",
      },
      {
        title: plan
          ? `Oldd fel a riasztásokat ${formatDecimal("hu", plan.priceLabel)}-ért`
          : "Oldd fel a riasztásokat egy kis összegű USDC-fizetéssel",
        body: `${plan ? `${huDays(plan.days)} hozzáférés, fizetés` : "Fizetés"} USDC-ben${paidOn}. Nincs automatikus megújítás.`,
      },
      {
        title: "Válassz küszöbértéket minden piacra",
        body: `Legalább ${formatDecimal("hu", threshold.min)} (a Morphón ${formatDecimal("hu", morphoMin)}), legfeljebb ${formatDecimal("hu", threshold.max)}, alapértelmezetten ${formatDecimal("hu", threshold.default)}.`,
      },
      {
        title: "Kapj üzenetet, amíg alatta vagy",
        body: `${minutes} percenként, ${onChannels(channels)}, amíg vissza nem kerülsz a küszöbértéked fölé.`,
      },
    ];
  },
  scaleTitle: "Hová tedd a küszöbértéket",
  scale: {
    liquidation: "likvidálás",
    critical: "Kritikus",
    risky: "Kockázatos",
    safe: "Biztonságos",
    defaultThreshold: value => `Alapértelmezett: ${value}`,
    below: value => `${value} alatt`,
    between: (from, to) => `${from} és ${to} között`,
    andAbove: value => `${value} vagy több`,
    range: (min, max) => `Bármilyen érték ${min} és ${max} között.`,
  },
  scaleGuide: "Hogyan válassz küszöbértéket",

  coverageTitle: "Minden Aave-piac és minden listázott Morpho-piac",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${v3Markets} Aave V3-piac ${v3Networks} hálózaton és ${spokes} Aave V4 Spoke ${v4Networks} hálózaton (2026. október 16-i állapot), valamint minden listázott Morpho-piac ${morphoNetworks} hálózaton.`,
  coverage: {
    v3Markets: count => `${count} V3-piac`,
    v4Spokes: count => `${count} V4 Spoke`,
    morpho: "Morpho",
  },
  coverageNote:
    "A Scroll, a ZKsync, a Metis, a Soneium és a Sonic piacait az Aave governance fokozatosan kivezeti, de továbbra is figyeljük őket. Nem tartozik bele: az Aave V3 a Harmony hálózaton, a nem listázott Morpho-piacok és más protokollok.",

  pricingTitle: "Árak",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Riasztások", detail: capitalize(alertPrice) },
    { term: "Megújítás", detail: "Nem automatikus: fizess újra, ha több időt szeretnél" },
    {
      term: "Fizetés",
      detail: paymentChain
        ? `USDC ${huOnMarket(paymentChain, "network")}, a tárcádból (jóváhagyás, majd fizetés)`
        : "USDC, a tárcádból",
    },
  ],
  priceSource: "Az árat a fizetési szerződésből olvassuk ki, és óránként frissítjük.",
  pricingFootnote: "A pozícióid megtekintéséért nem kell fizetned.",

  questionsTitle: "Kérdések, mielőtt tárcát csatlakoztatsz",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const chainOn = onChain(paymentChain);
    return [
      {
        question: "Hozzáfér a Tokenping a pénzemhez?",
        answer: rich(
          `Nem. A Tokenping csak olvassa a pozícióidat, és soha nem kér jóváhagyást vagy aláírást az Aave-on vagy a Morphón. Az egyetlen tranzakció a fizetés ${chainOn}: egy jóváhagyás pontosan az ár összegére, majd maga a fizetés. `,
          links.sourcify
            ? rich(
                "A szerződés ",
                links.sourcify("ellenőrzött a Sourcify-on"),
                ", és ",
                links.sourceCode("a forráskódja nyilvános"),
              )
            : links.sourceCode("A szerződés forráskódja nyilvános"),
          ". A csapat tárcája módosíthatja az árát, szüneteltetheti és frissítheti a szerződést.",
        ),
      },
      {
        question: "Mit tároltok?",
        answer: rich(
          "A tárcacímedet, a riasztásaidat és a megadott elérhetőségeidet (e-mail, Signal-felhasználónév",
          hasTelegram ? ", Telegram-csevegés" : "",
          `). Nincs előzmény és nincsenek nyomkövető sütik; az oldalmegtekintéseket névtelenül számoljuk. Ezeket az elérhetőségeket csak az olvashatja, aki tud aláírni a tárcáddal, a fizetések viszont nyilvánosak ${chainOn}. `,
          links.privacy("Az adatvédelmi oldalon"),
          " megtalálod a teljes listát.",
        ),
      },
      {
        question: "Mennyibe kerül?",
        answer: rich(
          `A riasztások ára ${alertPrice}, USDC-ben ${chainOn}, plusz egy kevés ETH a gas díjra. A pozícióid megtekintéséért nem kell fizetned. Nincs automatikus megújítás és nincs visszatérítés.`,
        ),
      },
      {
        question: "Mely Morpho-hitelekre terjed ki?",
        answer: rich(
          `A Morpho Blue (változó kamatozású) és a Morpho Midnight (fix kamatozású) hitelekre a Morpho alkalmazásban listázott piacokon, ${formatDecimal("hu", morphoMin)} értéktől induló küszöbértékkel. A fix kamatozású hitelekhez a lejárat előtt emlékeztető is jár. Ugyanaz a csomag fedezi őket: nyisd meg a `,
          links.morphoDashboard("Morpho irányítópultot"),
          ".",
        ),
      },
      {
        question: "Mi van, ha egy riasztás nem érkezik meg?",
        answer: rich(
          `A következő ellenőrzés ${minutes} perccel később újra próbálkozik. A kézbesítés ezeken múlik: Resend, egy Signal-továbbító,`,
          hasTelegram ? " a Telegram Bot API," : "",
          " nyilvános RPC-csomópontok és a Vercel ütemezője, rendelkezésre állási garancia nélkül. Válassz két csatornát, és hagyj magadnak időt a cselekvésre.",
        ),
      },
      {
        question: "Hogyan állíthatom le a riasztásokat?",
        answer: rich(
          "Leállnak, amint a health factorod visszakerül a küszöbértéked fölé, vagy amikor törlöd a riasztást (ehhez aktív hozzáférés kell). Lejárt a hozzáférésed? Írj nekünk az ",
          links.x("X-en"),
          ", vagy a közösségünkben a ",
          links.telegramCommunity("Telegramon"),
          " vagy a ",
          links.signalCommunity("Signalon"),
          ".",
          hasTelegram ? " A Telegramban a /stop parancs is működik." : "",
          " Szundi és leiratkozási link egyelőre nincs.",
        ),
      },
      {
        question: "Figyelhetek olyan tárcát, amelyet nem csatlakoztatok?",
        answer: rich("Egyelőre nem. Egy tárca, az, amelyiket csatlakoztatod; a hozzáférés tárcánként szól."),
      },
      {
        question: "Más eszközök semmibe sem kerülnek. Miért fizessek?",
        answer: rich(
          "Ha egy Telegram-bot vagy egy mobilalkalmazás megfelel neked, használd azt",
          links.comparison ? rich(": ", links.comparison("az összehasonlításunk"), " bemutatja őket") : null,
          ". A Tokenping azoknak szól, akik Signalon vagy e-mailben kérik a riasztásokat, minden Aave-piacon és minden listázott Morpho-piacon.",
        ),
      },
    ];
  },

  limitsTitle: "A korlátok, kertelés nélkül",
  limits: ({ minutes, paymentChain }) => [
    `Ellenőrzés ${minutes} percenként, nem folyamatosan.`,
    "A küszöbértéked alatt minden ellenőrzés újabb üzenetet küld: nincs szundi és nincs összesítő.",
    "Piaconként egy küszöbérték, csak a csatlakoztatott tárcára.",
    `Csak USDC${paymentChain ? ` ${huOnMarket(paymentChain, "network")}` : ""}: nincs kártya, nincs visszatérítés.`,
    "Az e-mailekben még nincs leiratkozási link; egy riasztás törléséhez aktív hozzáférés kell.",
    "Béta: külső szolgáltatók kézbesítenek, rendelkezésre állási garancia nélkül.",
  ],

  blogTitle: "A blogról",
  allGuides: "Minden Aave- és Morpho-útmutató",

  closingTitle: "Állítsd be az Aave vagy Morpho health factor-riasztásodat",
  closingLead: alertPrice => `${capitalize(alertPrice)}, a tárcádból fizetve. Nincs automatikus megújítás.`,
};
