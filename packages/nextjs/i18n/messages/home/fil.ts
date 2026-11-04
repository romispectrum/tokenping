import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal } from "~~/i18n/format";

/** "sa Arbitrum One", or the payment network unnamed. */
const filOnChain = (chainName: string | undefined) => (chainName ? `sa ${chainName}` : "sa network ng bayad");

export const MESSAGES: HomeMessages = {
  headline: channels => `Mga health factor alert para sa Aave at Morpho sa ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Mga alerto sa ${channels} kapag mas mababa sa threshold mo ang health factor mo sa Aave o Morpho, sa ${networks} network, bawat ${minutes} minuto.`
      : `Mga alerto sa ${channels} kapag bumaba sa threshold mo ang health factor mo sa Aave o Morpho, sa ${networks} network. Tinitingnan bawat ${minutes} minuto.`,
  channelBadge: capitalize,
  pricingCta: plan =>
    plan
      ? `Mag-set ng alerto: ${formatDecimal("fil", plan.priceLabel)} para sa ${plan.days} araw`
      : "Mag-set ng alerto",
  offerDescription: ({ days, currency }) =>
    `Mga health factor alert sa loob ng ${days} araw, binabayaran sa ${currency} mula sa wallet mo. Walang auto-renew.`,

  kicker: "Aave V3 at V4, Morpho Blue at Midnight",
  heroLead: ({ minutes, channels }) =>
    `Tinitingnan bawat ${minutes} minuto. May mensahe sa ${channels} habang nasa ilalim ka ng linya mo. Read-only, walang approval.`,
  networksLabel: "Mga network",
  heroCoverage: networks => `${networks} network`,
  channelsLabel: "Mga alerto sa:",
  exampleAlertLabel: "Ano ang sinasabi ng isang alerto",
  exampleAlertCaption: subject => `Halimbawa. Dumarating ang mga email na may subject na “${subject}”.`,

  dashboardCta: "Buksan ang Aave dashboard",
  morphoDashboardCta: "Buksan ang Morpho dashboard",
  dashboardCtaMicrocopy: alertPrice =>
    `Ikonekta ang wallet, tingnan ang bawat posisyon. Nagkakahalaga ang mga alerto ng ${alertPrice}.`,

  problemTitle: "Bumababa ang health factor habang tulog ka",
  problemLead:
    "Ipinapakita ng Aave ang health factor mo pero hindi ito nagpapadala ng alerto (Oktubre 2026). Tatlong bagay ang nagpapagalaw dito sa magdamag:",
  problemCauses: [
    { title: "Bumababa ang presyo", body: "Bumababa ang ETH at lumiliit ang halaga ng collateral mo." },
    { title: "Nadaragdagan ang interes", body: "Lumalaki ang utang mo bawat segundo." },
    {
      title: "Nagbabago ang threshold",
      body: "Sa Aave, puwedeng ibaba ng governance ang isang liquidation threshold.",
    },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Ikinukuwento ng mga borrower ang ",
      morning("paggising nang na-liquidate na ang posisyon nila"),
      ", ",
      failedRepays("isang oras ng mga repay na transaksyong pumapalya"),
      " at ",
      polygon("isang repay sa 1.01 na nahuli na"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "May bonus pang nakukuha ang liquidator: 5% sa WETH sa market na Ethereum Core (Oktubre 2026).",
      guide && rich(" Basahin kung ", guide("paano gumagana ang liquidation"), "."),
    ),
  chart: {
    threshold: "threshold mo",
    liquidation: "liquidation",
    alertSent: "Naipadala ang alerto",
    youCheck: "Tiningnan mo ang phone mo",
    caption:
      "Isang halimbawang gabi. Lumalabas ang alerto nang 03:05, sa unang pagtingin na mas mababa sa 1.5, limang oras bago ka tumingin.",
  },

  howItWorksTitle: "Paano ito gumagana",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` sa ${paymentChain}` : "";
    return [
      {
        title: "Ikonekta ang wallet na ginagamit mo sa pag-borrow",
        body: "Read-only. Aave at Morpho, tig-isang page.",
      },
      {
        title: plan
          ? `I-unlock ang mga alerto sa halagang ${formatDecimal("fil", plan.priceLabel)}`
          : "I-unlock ang mga alerto gamit ang maliit na bayad sa USDC",
        body: `${plan ? `${plan.days} araw, binabayaran` : "Binabayaran"} gamit ang USDC${paidOn}. Walang auto-renew.`,
      },
      {
        title: "Pumili ng linya para sa bawat market",
        body: `Mula ${formatDecimal("fil", threshold.min)} (${formatDecimal("fil", morphoMin)} sa Morpho) hanggang ${formatDecimal("fil", threshold.max)}, default ${formatDecimal("fil", threshold.default)}.`,
      },
      {
        title: "Makatanggap ng mensahe habang nasa ilalim ka nito",
        body: `Bawat ${minutes} minuto, sa ${channels}, hanggang makabalik ka sa itaas ng linya mo.`,
      },
    ];
  },
  scaleTitle: "Saan ilalagay ang linya mo",
  scale: {
    liquidation: "liquidation",
    critical: "Kritikal",
    risky: "Delikado",
    safe: "Ligtas",
    defaultThreshold: value => `Default ${value}`,
    below: value => `Mas mababa sa ${value}`,
    between: (from, to) => `${from} hanggang ${to}`,
    andAbove: value => `${value} pataas`,
    range: (min, max) => `Anumang value mula ${min} hanggang ${max}.`,
  },
  scaleGuide: "Paano pumili ng threshold",

  coverageTitle: "Bawat Aave market at bawat nakalistang Morpho market",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${v3Markets} market ng Aave V3 sa ${v3Networks} network at ${spokes} Aave V4 Spoke sa ${v4Networks} network, noong Nobyembre 4, 2026, dagdag pa ang bawat nakalistang Morpho market sa ${morphoNetworks} network.`,
  coverage: {
    v3Markets: count => `${count} V3 market`,
    v4Spokes: count => `${count} V4 Spoke`,
    morpho: "Morpho",
  },
  coverageNote:
    "Unti-unting isinasara ng governance ng Aave ang Scroll, ZKsync, Metis, Soneium at Sonic, at binabantayan pa rin ang mga ito. Hindi sakop: Aave V3 sa Harmony, mga hindi nakalistang Morpho market at ibang protocol.",

  pricingTitle: "Presyo",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Mga alerto", detail: capitalize(alertPrice) },
    { term: "Pag-renew", detail: "Hindi awtomatiko: magbayad ulit kapag gusto mo ng dagdag na oras" },
    {
      term: "Bayad",
      detail: paymentChain
        ? `USDC sa ${paymentChain}, mula sa wallet mo (i-approve, tapos magbayad)`
        : "USDC, mula sa wallet mo",
    },
  ],
  priceSource: "Binabasa ang presyo mula sa payment contract at nire-refresh kada oras.",
  pricingFootnote: "Hindi mo kailangang magbayad para tingnan ang mga posisyon mo.",

  questionsTitle: "Mga tanong bago ka magkonekta ng wallet",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = filOnChain(paymentChain);
    return [
      {
        question: "Kaya bang galawin ng Tokenping ang pondo ko?",
        answer: rich(
          `Hindi. Binabasa lang ng Tokenping ang mga posisyon mo at hindi ito kailanman humihingi ng approval o pirma sa Aave o Morpho. Ang tanging mga transaksyon ay ang bayad ${onChain}: isang approval para sa eksaktong presyo, tapos ang bayad. `,
          links.sourcify
            ? rich(
                "Ang contract ay ",
                links.sourcify("verified sa Sourcify"),
                " at ",
                links.sourceCode("public ang source code nito"),
              )
            : links.sourceCode("Public ang source code ng contract"),
          "; puwedeng baguhin ng wallet ng team ang presyo nito, i-pause ito at i-upgrade ito.",
        ),
      },
      {
        question: "Ano ang iniimbak ng Tokenping?",
        answer: rich(
          "Ang wallet address mo, ang mga alerto mo at ang mga contact detail na ibinigay mo (email, Signal username",
          hasTelegram ? ", Telegram chat" : "",
          `). Walang history at walang tracking cookie; binibilang nang anonymous ang mga page view. Ang may kakayahang pumirma gamit ang wallet mo lang ang makakabasa ng mga contact detail na iyon, pero public ang mga bayad ${onChain}. Nasa `,
          links.privacy("privacy page"),
          " ang buong listahan.",
        ),
      },
      {
        question: "Magkano ito?",
        answer: rich(
          `Nagkakahalaga ang mga alerto ng ${alertPrice}, sa USDC ${onChain}, dagdag ang kaunting ETH para sa gas. Hindi mo kailangang magbayad para tingnan ang mga posisyon mo. Walang auto-renew, walang refund.`,
        ),
      },
      {
        question: "Aling mga Morpho loan ang sakop?",
        answer: rich(
          `Mga loan sa Morpho Blue (variable rate) at Morpho Midnight (fixed rate) sa mga market na nakalista sa Morpho app, na may threshold mula ${formatDecimal("fil", morphoMin)}. Nakakatanggap din ng mga paalala ang fixed-rate na loan bago ang maturity nito. Sakop sila ng parehong plan: buksan ang `,
          links.morphoDashboard("Morpho dashboard"),
          ".",
        ),
      },
      {
        question: "Paano kung hindi dumating ang alerto?",
        answer: rich(
          "Susubukan ulit ng susunod na pagtingin, ",
          minutes,
          " minuto pagkalipas. Umaasa ang pagpapadala sa Resend, sa isang Signal relay,",
          hasTelegram ? " sa Telegram Bot API," : "",
          " sa mga public RPC node at sa scheduler ng Vercel, nang walang garantiya sa uptime. Pumili ng dalawang channel at mag-iwan ng panahon para kumilos.",
        ),
      },
      {
        question: "Paano ko ititigil ang mga alerto?",
        answer: rich(
          "Titigil ang mga ito kapag nakabalik na ang health factor mo sa itaas ng linya mo, o kapag na-delete mo ang alerto (kailangan ng aktibong access). Expired na ang access mo? Mag-message sa amin sa ",
          links.x("X"),
          " o sa community namin sa ",
          links.telegramCommunity("Telegram"),
          " o ",
          links.signalCommunity("Signal"),
          ".",
          hasTelegram ? " Sa Telegram, gumagana rin ang /stop." : "",
          " Wala pang snooze at wala pang unsubscribe link.",
        ),
      },
      {
        question: "Puwede ko bang bantayan ang wallet na hindi ko ikinokonekta?",
        answer: rich("Hindi pa sa ngayon. Isang wallet, ang ikinonekta mo; per wallet ang access."),
      },
      {
        question: "Walang bayad ang ibang tool. Bakit pa magbabayad?",
        answer: rich(
          "Kung bagay sa iyo ang isang Telegram bot o mobile app, gamitin mo iyon",
          links.comparison ? rich(": nasa ", links.comparison("paghahambing namin"), " ang mga ito") : null,
          ". Para sa mga alerto sa Signal o email ang Tokenping, sa bawat Aave market at nakalistang Morpho market.",
        ),
      },
    ];
  },

  limitsTitle: "Mga limitasyon, sinabi nang diretso",
  limits: ({ minutes, paymentChain }) => [
    `Tumitingin bawat ${minutes} minuto, hindi tuloy-tuloy.`,
    "Nagpapadala ng panibagong mensahe ang bawat pagtingin na nasa ilalim ng linya mo: walang snooze o digest.",
    "Isang linya kada market, para lang sa nakakonektang wallet.",
    `USDC${paymentChain ? ` sa ${paymentChain}` : ""} lang: walang card, walang refund.`,
    "Wala pang unsubscribe link sa mga email; kailangan ng aktibong access para mag-delete ng alerto.",
    "Beta: third-party ang pagpapadala, walang garantiya sa uptime.",
  ],

  blogTitle: "Mula sa blog",
  allGuides: "Lahat ng gabay sa Aave at Morpho",

  closingTitle: "I-set up ang health factor alert mo para sa Aave o Morpho",
  closingLead: alertPrice => `${capitalize(alertPrice)}, binabayaran mula sa wallet mo. Walang auto-renew.`,
};
