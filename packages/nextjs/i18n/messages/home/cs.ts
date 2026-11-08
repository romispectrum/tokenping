import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal, plural } from "~~/i18n/format";
import type { AlertPlan } from "~~/services/marketing/alertPlan";

/** "na 30 dní", "na 1 den", "na 2 dny". */
const csForDays = (days: number) =>
  `na ${plural("cs", days, { one: `${days} den`, few: `${days} dny`, many: `${days} dne`, other: `${days} dní` })}`;

/** "každých 5 minut", "každé 2 minuty", "každou minutu". */
const csEveryMinutes = (minutes: number) =>
  plural("cs", minutes, {
    one: "každou minutu",
    few: `každé ${minutes} minuty`,
    many: `každých ${formatDecimal("cs", minutes)} minuty`,
    other: `každých ${minutes} minut`,
  });

const csPrice = (plan: AlertPlan) => `${formatDecimal("cs", plan.priceLabel)} ${csForDays(plan.days)}`;

/** "na 21 sítích", "na 1 síti". */
const csOnNetworks = (networks: number) =>
  plural("cs", networks, { one: `na ${networks} síti`, other: `na ${networks} sítích` });

/** "22 sítí", "2 sítě", "1 síť". */
const csNetworks = (networks: number) =>
  plural("cs", networks, { one: `${networks} síť`, few: `${networks} sítě`, other: `${networks} sítí` });

/** "24 trhů", "2 trhy", "1 trh". */
const csMarkets = (markets: number) =>
  plural("cs", markets, { one: `${markets} trh`, few: `${markets} trhy`, other: `${markets} trhů` });

/** "na síti Arbitrum One", or the payment network unnamed. */
const csOnChain = (chainName: string | undefined) => (chainName ? `na síti ${chainName}` : "na platební síti");

export const MESSAGES: HomeMessages = {
  headline: channels => `Upozornění na health factor na Aave a Morpho přes ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Upozornění přes ${channels}, když je health factor na Aave či Morpho pod prahem (${csNetworks(networks)}), kontrola ${csEveryMinutes(minutes)}.`
      : `Upozornění přes ${channels}, když health factor na Aave či Morpho klesne pod váš práh, ${csOnNetworks(networks)}. Kontrola ${csEveryMinutes(minutes)}.`,
  channelBadge: capitalize,
  pricingCta: plan => (plan ? `Nastavit upozornění: ${csPrice(plan)}` : "Nastavit upozornění"),
  offerDescription: ({ days, currency }) =>
    `Upozornění na health factor ${csForDays(days)}, placená v ${currency} z vaší peněženky. Bez automatického obnovení.`,

  kicker: "Aave V3 a V4, Morpho Blue a Midnight",
  heroLead: ({ minutes, channels }) =>
    `Kontrola ${csEveryMinutes(minutes)}. Zpráva přes ${channels}, dokud jste pod svou hranicí. Jen pro čtení, bez schválení.`,
  networksLabel: "Sítě",
  heroCoverage: networks => csNetworks(networks),
  channelsLabel: "Upozornění přes:",
  exampleAlertLabel: "Co vám upozornění napíše",
  exampleAlertCaption: subject => `Ukázka. E-maily chodí s předmětem „${subject}“.`,

  dashboardCta: "Otevřít přehled Aave",
  morphoDashboardCta: "Otevřít přehled Morpho",
  dashboardCtaMicrocopy: alertPrice => `Připojte peněženku a uvidíte všechny pozice. Upozornění stojí ${alertPrice}.`,

  problemTitle: "Health factor klesá, i když spíte",
  problemLead: "Aave váš health factor ukazuje, ale upozornění neposílá (říjen 2026). Přes noc s ním hýbou tři věci:",
  problemCauses: [
    { title: "Ceny klesají", body: "ETH spadne a váš kolaterál má nižší hodnotu." },
    { title: "Úrok přibývá", body: "Váš dluh roste každou vteřinu." },
    { title: "Prahy se mění", body: "Na Aave může governance snížit likvidační práh." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Dlužníci popisují, ",
      morning("jak se ráno probudili se zlikvidovanou pozicí"),
      ", ",
      failedRepays("hodinu selhávajících transakcí na splacení"),
      " i ",
      polygon("splátku při 1,01, která přišla pozdě"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "Likvidátor si k tomu nechá bonus: 5 % u WETH na trhu Core na Ethereu (říjen 2026).",
      guide && rich(" Podrobnosti: ", guide("jak funguje likvidace"), "."),
    ),
  chart: {
    threshold: "váš práh",
    liquidation: "likvidace",
    alertSent: "Upozornění odesláno",
    youCheck: "Podíváte se do telefonu",
    caption:
      "Ukázková noc. Upozornění odchází ve 3:05, při první kontrole pod 1,5, pět hodin předtím, než se podíváte.",
  },

  howItWorksTitle: "Jak to funguje",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` na síti ${paymentChain}` : "";
    return [
      {
        title: "Připojte peněženku, se kterou si půjčujete",
        body: "Jen pro čtení. Aave a Morpho, každý na své stránce.",
      },
      {
        title: plan
          ? `Odemkněte upozornění za ${formatDecimal("cs", plan.priceLabel)}`
          : "Odemkněte upozornění malou platbou v USDC",
        body: `${plan ? `${capitalize(csForDays(plan.days))}, platba` : "Platba"} v USDC${paidOn}. Bez automatického obnovení.`,
      },
      {
        title: "Pro každý trh zvolte hranici",
        body: `Od ${formatDecimal("cs", threshold.min)} (na Morpho od ${formatDecimal("cs", morphoMin)}) do ${formatDecimal("cs", threshold.max)}, výchozí ${formatDecimal("cs", threshold.default)}.`,
      },
      {
        title: "Dostávejte zprávy, dokud jste pod ní",
        body: `${capitalize(csEveryMinutes(minutes))}, přes ${channels}, dokud se nevrátíte nad svou hranici.`,
      },
    ];
  },
  scaleTitle: "Kam hranici umístit",
  scale: {
    liquidation: "likvidace",
    critical: "Kritický",
    risky: "Rizikový",
    safe: "Bezpečný",
    defaultThreshold: value => `Výchozí ${value}`,
    below: value => `Pod ${value}`,
    between: (from, to) => `${from} až ${to}`,
    andAbove: value => `${value} a více`,
    range: (min, max) => `Libovolná hodnota od ${min} do ${max}.`,
  },
  scaleGuide: "Jak zvolit práh",

  coverageTitle: "Všechny trhy Aave a všechny uvedené trhy Morpho",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${csMarkets(v3Markets)} Aave V3 ${csOnNetworks(v3Networks)} a ${csMarkets(spokes)} (Spoke) Aave V4 ${csOnNetworks(v4Networks)}, ke 4. listopadu 2026, a k tomu všechny uvedené trhy Morpho ${csOnNetworks(morphoNetworks)}.`,
  coverage: {
    v3Markets: count => `${csMarkets(count)} V3`,
    v4Spokes: count => `${csMarkets(count)} V4 (Spoke)`,
    morpho: "Morpho",
  },
  coverageNote:
    "Trhy na sítích Scroll, ZKsync, Metis, Soneium a Sonic governance Aave postupně ukončuje a dál je hlídáme. Nepokrýváme trh Aave V3 na síti Harmony, neuvedené trhy Morpho ani jiné protokoly.",

  pricingTitle: "Ceník",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Upozornění", detail: capitalize(alertPrice) },
    { term: "Obnovení", detail: "Žádné automatické: když chcete delší přístup, zaplatíte znovu" },
    {
      term: "Platba",
      detail: paymentChain
        ? `USDC na síti ${paymentChain} z vaší peněženky (schválení, pak platba)`
        : "USDC z vaší peněženky",
    },
  ],
  priceSource: "Cena se načítá z platebního kontraktu a obnovuje se každou hodinu.",
  pricingFootnote: "Prohlížení pozic nevyžaduje žádnou platbu.",

  questionsTitle: "Na co se zeptat, než připojíte peněženku",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = csOnChain(paymentChain);
    return [
      {
        question: "Může Tokenping sáhnout na mé prostředky?",
        answer: rich(
          `Ne. Tokenping vaše pozice jen čte a na Aave ani na Morpho nikdy nežádá o schválení ani o podpis. Jediné transakce jsou platba ${onChain}: schválení přesně této částky, pak platba. `,
          links.sourcify
            ? rich(
                "Kontrakt je ",
                links.sourcify("ověřený na Sourcify"),
                " a jeho ",
                links.sourceCode("zdrojový kód je veřejný"),
              )
            : links.sourceCode("Zdrojový kód kontraktu je veřejný"),
          "; peněženka týmu mu může změnit cenu, pozastavit ho a upgradovat.",
        ),
      },
      {
        question: "Co ukládáte?",
        answer: rich(
          "Adresu vaší peněženky, vaše upozornění a kontakty, které zadáte (e-mail, jméno na Signalu",
          hasTelegram ? ", chat na Telegramu" : "",
          `). Žádnou historii a žádné sledovací cookies; zobrazení stránek počítáme anonymně. Uložené kontakty si zobrazí jen ten, kdo umí podepisovat vaší peněženkou, ale platby jsou ${onChain} veřejné. Úplný seznam má `,
          links.privacy("stránka o ochraně soukromí"),
          ".",
        ),
      },
      {
        question: "Kolik to stojí?",
        answer: rich(
          `Upozornění stojí ${alertPrice}, v USDC ${onChain}, plus trochu ETH na gas. Prohlížení pozic nevyžaduje žádnou platbu. Bez automatického obnovení, bez vracení peněz.`,
        ),
      },
      {
        question: "Které půjčky na Morpho pokrýváte?",
        answer: rich(
          `Půjčky na Morpho Blue (variabilní sazba) a Morpho Midnight (pevná sazba) na trzích, které uvádí aplikace Morpho, s prahem už od ${formatDecimal("cs", morphoMin)}. Půjčka s pevnou sazbou navíc dostane připomínky před splatností. Pokrývá je stejná platba: otevřete `,
          links.morphoDashboard("přehled Morpho"),
          ".",
        ),
      },
      {
        question: "Co když upozornění nedorazí?",
        answer: rich(
          `Další kontrola o ${plural("cs", minutes, { one: "minutu", few: `${minutes} minuty`, other: `${minutes} minut` })} později to zkusí znovu. Doručení závisí na Resendu, relayi pro Signal, `,
          hasTelegram ? "Telegram Bot API, " : "",
          "veřejných RPC uzlech a plánovači Vercelu, bez záruky dostupnosti. Zvolte dva kanály a nechte si rezervu na reakci.",
        ),
      },
      {
        question: "Jak upozornění zastavím?",
        answer: rich(
          "Přestanou, jakmile se health factor vrátí nad vaši hranici, nebo když upozornění smažete (vyžaduje aktivní přístup). Přístup vypršel? Napište nám na ",
          links.x("X"),
          " nebo do naší komunity na ",
          links.telegramCommunity("Telegramu"),
          " či ",
          links.signalCommunity("Signalu"),
          ".",
          hasTelegram ? " V Telegramu funguje i /stop." : "",
          " Odložení ani odkaz pro odhlášení zatím nejsou.",
        ),
      },
      {
        question: "Můžu sledovat peněženku, kterou nepřipojím?",
        answer: rich("Zatím ne. Jedna peněženka, ta připojená; přístup platí pro každou peněženku zvlášť."),
      },
      {
        question: "Jiné nástroje nic nestojí. Proč platit?",
        answer: rich(
          "Pokud vám vyhovuje bot na Telegramu nebo mobilní aplikace, použijte je",
          links.comparison ? rich(": popisuje je naše ", links.comparison("srovnání")) : null,
          ". Tokenping je pro upozornění přes Signal nebo e-mail, na každém trhu Aave a uvedeném trhu Morpho.",
        ),
      },
    ];
  },

  limitsTitle: "Omezení bez příkras",
  limits: ({ minutes, paymentChain, repeatMinutes }) => [
    `Kontroly ${csEveryMinutes(minutes)}, ne v reálném čase.`,
    `Pod hranicí dostanete zprávu každých ${repeatMinutes} minut: bez odložení i souhrnu.`,
    "Jedna hranice na trh, jen pro připojenou peněženku.",
    `Jen USDC${paymentChain ? ` na síti ${paymentChain}` : ""}: bez karty, bez vracení peněz.`,
    "E-maily zatím nemají odkaz pro odhlášení; smazání upozornění vyžaduje aktivní přístup.",
    "Beta: doručení přes třetí strany, bez záruky dostupnosti.",
  ],

  blogTitle: "Z blogu",
  allGuides: "Všichni průvodci k Aave a Morpho",

  closingTitle: "Nastavte si upozornění na health factor na Aave nebo Morpho",
  closingLead: alertPrice => `${capitalize(alertPrice)}, platí se z vaší peněženky. Bez automatického obnovení.`,
};
