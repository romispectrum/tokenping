import { Fragment, type ReactNode, createElement } from "react";
import { formatDecimal, plural } from "~~/i18n/format";
import type { Localized } from "~~/i18n/locales";
import type { AlertPlan } from "~~/services/marketing/alertPlan";

// The homepage's copy (components/home), both languages. Numbers and names that depend on the deployment (networks,
// channels, price, payment network) arrive as arguments, so the visible text, the metadata and the JSON-LD agree.
// Paragraphs with links take a function per link and place it in their own word order.

/** Renders a link around its text; the component decides the target. */
type LinkText = (text: string) => ReactNode;

/** Rich text: the parts as one fragment, split into text nodes exactly where they are listed. */
const rich = (...parts: ReactNode[]) => createElement(Fragment, null, ...parts);

type HomeMessages = {
  // Metadata, headline and JSON-LD (homeContent)
  /** Headline A: "Aave health factor alerts on Signal and email" (channels joined with "and"). */
  headline: (channels: string) => string;
  /** The meta description; `short` is the fallback once the full one passes 155 characters. */
  description: (input: { channels: string; networks: number; minutes: number; short: boolean }) => string;
  /** The /aave line of the market's network names: "Ethereum (Core market)". */
  coreMarketNetwork: (name: string) => string;
  /** A channel as a badge: "Email" / "E-mail". */
  channelBadge: (name: string) => string;
  pricingCta: (plan: AlertPlan | null) => string;
  offerDescription: (input: { days: number; currency: string }) => string;

  // Hero
  kicker: string;
  heroLead: (input: { minutes: number; channels: string }) => string;
  seeHowItWorks: string;
  networksLabel: string;
  channelsLabel: string;
  coverageNote: string;
  exampleAlertLabel: string;
  exampleAlertCaption: (subject: string) => string;

  // The primary action, in the hero and the closing band
  dashboardCta: string;
  dashboardCtaMicrocopy: (networks: number) => string;

  // The problem
  problemTitle: string;
  problemNoAlerts: string;
  problemForums: (links: { morning: LinkText; failedRepays: LinkText; polygon: LinkText }) => ReactNode;
  /** `guide` is there only while the liquidation guide is published in this language. */
  problemLiquidator: (guide?: LinkText) => ReactNode;

  // How it works
  howItWorksTitle: string;
  steps: (input: {
    plan: AlertPlan | null;
    paymentChain: string | undefined;
    networks: number;
    minutes: number;
    channels: string;
    threshold: { min: number; max: number; default: number };
  }) => { title: string; body: string }[];

  // Pricing
  pricingTitle: string;
  /** `alertPrice`: "3 USDC per 30 days", or the priceless fallback, as it reads inside a sentence (AlertPrice). */
  pricingRows: (input: { alertPrice: string; paymentChain: string | undefined }) => { term: string; detail: string }[];
  priceSource: string;
  pricingFootnote: (paymentChain: string | undefined) => string;

  // Questions
  questionsTitle: string;
  questions: (input: {
    /** As in the pricing rows: "3 USDC per 30 days" or the fallback. */
    alertPrice: string;
    paymentChain: string | undefined;
    hasTelegram: boolean;
    minutes: number;
    networkList: string;
    links: {
      /** Undefined while the paywall is not verified anywhere (a local build). */
      sourcify?: LinkText;
      sourceCode: LinkText;
      privacy: LinkText;
      x: LinkText;
      telegramCommunity: LinkText;
      /** Undefined while the comparison post is not published in this language. */
      comparison?: LinkText;
    };
  }) => { question: string; answer: ReactNode }[];

  // Limits
  limitsTitle: string;
  limits: (input: { networks: number; minutes: number; paymentChain: string | undefined }) => string[];

  // From the blog
  blogTitle: string;
  allGuides: string;

  // Closing band
  closingTitle: string;
  closingLead: (networks: number) => string;
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const enDays = (days: number) => (days === 1 ? "1 day" : `${days} days`);

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

/** "na síti Arbitrum One", or the payment network unnamed. */
const csOnChain = (chainName: string | undefined) => (chainName ? `na síti ${chainName}` : "na platební síti");

export const HOME_MESSAGES: Localized<HomeMessages> = {
  en: {
    headline: channels => `Aave health factor alerts on ${channels}`,
    description: ({ channels, networks, minutes, short }) =>
      short
        ? `${channels} alerts when your Aave V3 health factor is below your threshold on ${networks} networks, checked every ${minutes} minutes. No approvals on Aave.`
        : `${channels} alerts when your Aave V3 health factor drops below your threshold on ${networks} networks. Checked every ${minutes} minutes. No approvals on your position.`,
    coreMarketNetwork: name => `${name} (Core market)`,
    channelBadge: capitalize,
    pricingCta: plan => (plan ? `Set up alerts: ${plan.priceLabel} for ${enDays(plan.days)}` : "Set up alerts"),
    offerDescription: ({ days, currency }) =>
      `Health factor alerts for ${days} days, paid in ${currency} from your wallet. No auto-renew.`,

    kicker: "Aave V3 health factor alerts",
    heroLead: ({ minutes, channels }) =>
      `Read-only: no approvals on your Aave position and no minimum size. We check every ${minutes} minutes and alert you by ${channels} whenever your health factor is below the line you set.`,
    seeHowItWorks: "See how it works",
    networksLabel: "Networks:",
    channelsLabel: "Alerts by:",
    coverageNote: "Aave V3 only. On Ethereum, the Core market.",
    exampleAlertLabel: "What an alert says",
    exampleAlertCaption: subject =>
      `Example only: the network, numbers and time are made up. Emails arrive with the subject "${subject}".`,

    dashboardCta: "Open the free dashboard",
    dashboardCtaMicrocopy: networks =>
      `Connect a wallet to see your Aave V3 health factor on ${networks} networks. Viewing is read-only.`,

    problemTitle: "Health factors fall while you sleep",
    problemNoAlerts:
      "Aave shows your health factor in its app and warns you inside its transaction screens, but as of October 2026 it doesn't send alerts. ETH drops overnight, interest keeps accruing on your debt, or a governance update trims a liquidation threshold, and nothing messages you about any of it.",
    problemForums: ({ morning, failedRepays, polygon }) =>
      rich(
        "On Aave's governance forum, one borrower describes",
        " ",
        morning("checking in the morning to find the position liquidated again"),
        "; another,",
        " ",
        failedRepays("an hour of repay transactions that kept failing until the position was liquidated"),
        ". On the Polygon forum in 2021, before Aave V3, one borrower",
        " ",
        polygon("tried to repay at a health factor of 1.01"),
        " and was liquidated before the transaction went through.",
      ),
    problemLiquidator: guide =>
      rich(
        "By the time you look, a liquidator may have taken collateral worth the repaid debt plus a bonus: 5% on WETH in the Ethereum Core market as of October 2026.",
        guide && rich(" ", guide("What happens in an Aave liquidation"), " ", "walks through the rules."),
      ),

    howItWorksTitle: "How it works, in 4 steps",
    steps: ({ plan, paymentChain, networks, minutes, channels, threshold }) => {
      const paidOn = paymentChain ? ` on ${paymentChain}` : "";
      return [
        {
          title: "Connect the wallet you borrow with (read-only, free)",
          body: `The dashboard shows that wallet's Aave V3 collateral, debt and health factor on all ${networks} networks. Tokenping watches the wallet you connect; you can't add another address.`,
        },
        {
          title: plan
            ? `Unlock alerts: ${plan.priceLabel} for ${plan.days} days, paid${paidOn} (approve, then pay)`
            : `Unlock alerts with a small USDC payment${paidOn} (approve, then pay)`,
          body: "Two wallet transactions: an approval for exactly the price, never an unlimited one, then the payment. Nothing renews automatically.",
        },
        {
          title: `Pick a threshold and your channels for each network (${threshold.min} to ${threshold.max}, default ${threshold.default})`,
          body: `Each network is a separate alert. Send it to ${channels}, or to more than one.`,
        },
        {
          title: `We check every ${minutes} minutes and message you while you're below it`,
          body: "Every check sends one message per channel until your health factor is back at or above your threshold, or you delete the alert. A fast drop can cross 1.0 between two checks.",
        },
      ];
    },

    pricingTitle: "Pricing",
    pricingRows: ({ alertPrice, paymentChain }) => [
      { term: "Dashboard", detail: "Free" },
      { term: "Alerts", detail: capitalize(alertPrice) },
      { term: "Renewal", detail: "None automatic: you pay again when you want more time" },
      {
        term: "Payment",
        detail: paymentChain
          ? `USDC on ${paymentChain}, from your wallet (approve, then pay)`
          : "USDC, from your wallet",
      },
    ],
    priceSource: "The price is read from the payment contract and refreshed hourly.",
    pricingFootnote: paymentChain => `Paid in USDC${paymentChain ? ` on ${paymentChain}` : ""}. No auto-renew.`,

    questionsTitle: "Questions to ask before you connect a wallet",
    questions: ({ alertPrice, paymentChain, hasTelegram, minutes, networkList, links }) => {
      const chainName = paymentChain ?? "the payment network";
      return [
        {
          question: "Can Tokenping touch my funds?",
          answer: rich(
            "No. Tokenping reads your positions and health factor with read-only calls and never asks for an approval or a signature on Aave. The only wallet transactions are the payment for alerts: an approval for exactly the price, never an unlimited one, then the payment, both on ",
            chainName,
            ". The payment contract",
            links.sourcify && rich(" ", "is ", links.sourcify("verified on Sourcify"), " and its"),
            " ",
            links.sourceCode("source code is public on GitHub"),
            ". It is upgradeable and controlled by the Tokenping team's wallet, which can change the price, pause payments, withdraw what was paid and upgrade the contract.",
          ),
        },
        {
          question: "What do you store?",
          answer: rich(
            "Your wallet address, the networks and thresholds you set, the channels you picked, and your email address and/or Signal username",
            hasTelegram ? ", plus your Telegram chat ID and username if you link Telegram" : "",
            '. If you answer the optional "How did you hear about Tokenping?" question, that answer too. Tokenping keeps no health factor history and no log of sent alerts, and this site runs no analytics. To read your positions, your wallet address is sent to RPC providers. Payments are public on ',
            chainName,
            ": anyone can see the paying address, the amount and the new expiry. Until the app checks wallet signatures, anyone who knows your wallet address can look up the contact details saved for it. The ",
            links.privacy("privacy page"),
            " explains this and lists every service that handles your data.",
          ),
        },
        {
          question: "What does it cost, and is there a catch?",
          answer: rich(
            "The dashboard is free. Alerts cost ",
            alertPrice,
            ", paid in native USDC on ",
            chainName,
            " even if your position is on another network, so you need USDC and a little ETH for gas there. It takes two transactions: approve, then pay. Nothing renews automatically, and paying again extends your access from its current end date. The contract has no refund function.",
          ),
        },
        {
          question: "What if an alert doesn't arrive?",
          answer: rich(
            "Tokenping checks every ",
            minutes,
            " minutes. A failed check or message is logged, and the next check tries again while your health factor is still below your threshold. Delivery depends on third parties (Resend for email, a Signal relay,",
            hasTelegram ? " the Telegram Bot API," : "",
            " public RPC nodes and Vercel's scheduler), and Tokenping is in beta with no uptime guarantee. A fast crash can cross 1.0 between two checks. So pick two channels, set your threshold with room to act, and don't make an alert your only safeguard.",
          ),
        },
        {
          question: "Is my position supported?",
          answer: rich(
            `Aave V3 on ${networkList}. Not supported: Aave V4 (live on Ethereum, Avalanche, Arc and Base as of October 2026), the other Aave V3 markets on Ethereum (Prime/Lido, EtherFi, Horizon), other Aave networks and other protocols. You get one alert per network, for the wallet you connect.`,
          ),
        },
        {
          question: "How often will I be alerted, and how do I stop it?",
          answer: rich(
            "Every ",
            minutes,
            " minutes on each channel you picked, for as long as your health factor is below your threshold. Alerts stop when it is back at or above your threshold, or when you delete the alert, which needs active access. If your access has expired, message us on",
            " ",
            links.x("X"),
            " or in our",
            " ",
            links.telegramCommunity("Telegram community"),
            " and we'll delete it.",
            hasTelegram ? " In Telegram you can also send /stop to the alert bot." : "",
            ' There is no snooze, no "recovered" message and no unsubscribe link in the emails yet.',
          ),
        },
        {
          question: "Can I watch a wallet I don't connect, or several wallets?",
          answer: rich("Not today. Tokenping watches the wallet you connect, and access is per paying wallet."),
        },
        {
          question: "Other tools are free. Why pay?",
          answer: rich(
            "If a Telegram bot or a mobile app works for you and you'd rather paste any address than connect a wallet, free tools exist",
            links.comparison
              ? rich(
                  ":",
                  " ",
                  links.comparison("our comparison of Aave liquidation alert tools"),
                  " ",
                  "covers them, including where they beat Tokenping",
                )
              : null,
            ". Tokenping is for people who want the alert on Signal or email, including for positions on Gnosis and Optimism.",
          ),
        },
      ];
    },

    limitsTitle: "Limits, stated plainly",
    limits: ({ networks, minutes, paymentChain }) => [
      `Aave V3 only, on ${networks} networks, and on Ethereum only the Core market. No Aave V4 and no other protocols.`,
      `Checks run every ${minutes} minutes, not in real time. A fast drop can liquidate a position between two checks.`,
      "While you're below your threshold, every check sends another message on each channel. There is no snooze, digest or recovery message.",
      "One threshold per network, for the connected wallet only. No watch-only addresses, price alerts or portfolio-wide alerts.",
      `Payment is in USDC${paymentChain ? ` on ${paymentChain}` : ""} only: no card payments, and the contract has no refund function.`,
      "Emails have no unsubscribe link yet, and deleting an alert needs active access.",
      "Tokenping is in beta. Delivery depends on third-party services, and there is no uptime guarantee.",
    ],

    blogTitle: "From the blog",
    allGuides: "All Aave health factor and liquidation guides",

    closingTitle: "Check your Aave V3 health factor, free",
    closingLead: networks =>
      `The dashboard shows collateral, debt and health factor for the wallet you connect on all ${networks} networks. Alerts are optional and paid.`,
  },
  cs: {
    // The headline is also the page title: the Telegram variant (63 characters with "přes") takes a colon to stay ≤ 60.
    headline: channels => {
      const headline = `Upozornění na Aave health factor přes ${channels}`;
      return headline.length <= 60 ? headline : `Upozornění na Aave health factor: ${channels}`;
    },
    description: ({ channels, networks, minutes, short }) =>
      short
        ? `Upozornění přes ${channels}, když je health factor na Aave V3 pod prahem, na ${networks} sítích, kontrola ${csEveryMinutes(minutes)}. Bez schválení na Aave.`
        : `Upozornění přes ${channels}, když health factor na Aave V3 klesne pod váš práh, na ${networks} sítích. Kontrola ${csEveryMinutes(minutes)}. Bez schválení na pozici.`,
    coreMarketNetwork: name => `${name} (trh Core)`,
    channelBadge: capitalize,
    pricingCta: plan => (plan ? `Nastavit upozornění: ${csPrice(plan)}` : "Nastavit upozornění"),
    offerDescription: ({ days, currency }) =>
      `Upozornění na health factor ${csForDays(days)}, placená v ${currency} z vaší peněženky. Bez automatického obnovení.`,

    kicker: "Upozornění na health factor v Aave V3",
    heroLead: ({ minutes, channels }) =>
      `Jen pro čtení: žádná schválení na vaší pozici v Aave a žádná minimální velikost. Kontrolujeme ${csEveryMinutes(minutes)} a pokaždé, když je váš health factor pod hranicí, kterou si nastavíte, vám dáme vědět přes ${channels}.`,
    seeHowItWorks: "Zjistit, jak to funguje",
    networksLabel: "Sítě:",
    channelsLabel: "Upozornění přes:",
    coverageNote: "Jen Aave V3. Na Ethereu trh Core.",
    exampleAlertLabel: "Co vám upozornění napíše",
    exampleAlertCaption: subject =>
      `Jen ukázka: síť, čísla i čas jsou smyšlené. E-maily chodí s předmětem „${subject}“.`,

    dashboardCta: "Otevřít přehled zdarma",
    dashboardCtaMicrocopy: networks =>
      `Připojte peněženku a uvidíte svůj health factor na Aave V3 napříč ${networks} sítěmi. Zobrazení je jen pro čtení.`,

    problemTitle: "Health factor klesá, i když spíte",
    problemNoAlerts:
      "Aave ukazuje váš health factor ve své aplikaci a varuje vás na obrazovkách transakcí, ale k říjnu 2026 žádná upozornění neposílá. ETH přes noc spadne, úrok na vašem dluhu dál přibývá nebo změna schválená v governance sníží likvidační práh, a nic vám o tom nedá vědět.",
    problemForums: ({ morning, failedRepays, polygon }) =>
      rich(
        "Na governance fóru Aave jeden dlužník popisuje, ",
        morning("jak ráno zjistil, že jeho pozice byla znovu zlikvidována"),
        ", druhý zase ",
        failedRepays("hodinu transakcí na splacení, které stále selhávaly, dokud pozice nebyla zlikvidována"),
        ". Na fóru Polygonu v roce 2021, ještě před Aave V3, se jeden dlužník ",
        polygon("pokusil splatit dluh při health factoru 1,01"),
        " a jeho pozice byla zlikvidována dřív, než transakce prošla.",
      ),
    problemLiquidator: guide =>
      rich(
        "Než se podíváte, likvidátor už mohl převzít kolaterál v hodnotě splaceného dluhu plus bonus: k říjnu 2026 je to 5 % u WETH na trhu Core na Ethereu.",
        guide && rich(" Pravidla vysvětluje průvodce ", guide("Jak funguje likvidace na Aave"), "."),
      ),

    howItWorksTitle: "Jak to funguje, ve 4 krocích",
    steps: ({ plan, paymentChain, networks, minutes, channels, threshold }) => {
      const paidOn = paymentChain ? ` na síti ${paymentChain}` : "";
      return [
        {
          title: "Připojte peněženku, se kterou si půjčujete (jen pro čtení, zdarma)",
          body: `Přehled ukáže kolaterál, dluh a health factor této peněženky na Aave V3 na všech ${networks} sítích. Tokenping hlídá peněženku, kterou připojíte; jinou adresu přidat nelze.`,
        },
        {
          title: plan
            ? `Odemkněte upozornění: ${csPrice(plan)}, platba${paidOn} (schválení, pak platba)`
            : `Odemkněte upozornění malou platbou v USDC${paidOn} (schválení, pak platba)`,
          body: "Dvě transakce v peněžence: schválení přesně této částky, nikdy neomezené, a pak platba. Nic se automaticky neobnovuje.",
        },
        {
          title: `Pro každou síť zvolte práh a kanály (od ${formatDecimal("cs", threshold.min)} do ${formatDecimal("cs", threshold.max)}, výchozí ${formatDecimal("cs", threshold.default)})`,
          body: `Každá síť má samostatné upozornění. Nechte si ho posílat přes ${channels}, případně do více kanálů zároveň.`,
        },
        {
          title: `Kontrolujeme ${csEveryMinutes(minutes)} a píšeme vám, dokud jste pod prahem`,
          body: "Každá kontrola pošle do každého kanálu jednu zprávu, dokud se váš health factor nevrátí na práh nebo nad něj, nebo dokud upozornění nesmažete. Při rychlém propadu může health factor klesnout pod 1,0 mezi dvěma kontrolami.",
        },
      ];
    },

    pricingTitle: "Ceník",
    pricingRows: ({ alertPrice, paymentChain }) => [
      { term: "Přehled", detail: "Zdarma" },
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
    pricingFootnote: paymentChain =>
      `Platba v USDC${paymentChain ? ` na síti ${paymentChain}` : ""}. Bez automatického obnovení.`,

    questionsTitle: "Na co se zeptat, než připojíte peněženku",
    questions: ({ alertPrice, paymentChain, hasTelegram, minutes, networkList, links }) => {
      const onChain = csOnChain(paymentChain);
      return [
        {
          question: "Může Tokenping sáhnout na mé prostředky?",
          answer: rich(
            `Ne. Tokenping čte vaše pozice a health factor voláními, která jsou jen pro čtení, a na Aave nikdy nežádá o schválení ani o podpis. Jediné transakce v peněžence jsou platba za upozornění: schválení přesně této částky, nikdy neomezené, a pak samotná platba, obojí ${onChain}. `,
            links.sourcify
              ? rich(
                  "Platební kontrakt je ",
                  links.sourcify("ověřený na Sourcify"),
                  " a jeho ",
                  links.sourceCode("zdrojový kód je veřejně na GitHubu"),
                )
              : links.sourceCode("Zdrojový kód platebního kontraktu je veřejně na GitHubu"),
            ". Kontrakt je upgradovatelný a ovládá ho peněženka týmu Tokenping, která může měnit cenu, pozastavit platby, vybrat zaplacené prostředky a kontrakt upgradovat.",
          ),
        },
        {
          question: "Co ukládáte?",
          answer: rich(
            "Adresu vaší peněženky, sítě a prahy, které nastavíte, zvolené kanály a vaši e-mailovou adresu nebo uživatelské jméno na Signalu, případně obojí",
            hasTelegram ? ", a pokud propojíte Telegram, také ID chatu a uživatelské jméno na Telegramu" : "",
            `. Pokud odpovíte na nepovinnou otázku „Jak jste se o Tokenpingu dozvěděli?“, uložíme i tuto odpověď. Tokenping neuchovává historii health factoru ani záznam odeslaných upozornění a tento web nepoužívá žádnou analytiku. Aby bylo možné načíst vaše pozice, posílá se adresa vaší peněženky poskytovatelům RPC. Platby jsou ${onChain} veřejné: kdokoli vidí platící adresu, částku a nové datum vypršení. Dokud aplikace neověřuje podpisy peněženky, může si kdokoli, kdo zná adresu vaší peněženky, zobrazit kontaktní údaje k ní uložené. Vše vysvětluje `,
            links.privacy("stránka o ochraně soukromí"),
            ", která také uvádí každou službu, jež s vašimi daty pracuje.",
          ),
        },
        {
          question: "Kolik to stojí a kde je háček?",
          answer: rich(
            `Přehled je zdarma. Za upozornění zaplatíte ${alertPrice}, a to v nativním USDC ${onChain}, i když je vaše pozice na jiné síti, takže tam potřebujete USDC a trochu ETH na gas. Jsou to dvě transakce: schválení, pak platba. Nic se automaticky neobnovuje a další platba prodlouží přístup od jeho současného konce. Kontrakt nemá funkci pro vrácení peněz.`,
          ),
        },
        {
          question: "Co když upozornění nedorazí?",
          answer: rich(
            `Tokenping kontroluje ${csEveryMinutes(minutes)}. Neúspěšná kontrola nebo zpráva se zapíše do logu a další kontrola to zkusí znovu, pokud je váš health factor stále pod prahem. Doručení závisí na třetích stranách (Resend pro e-mail, relay pro Signal, `,
            hasTelegram ? "Telegram Bot API, " : "",
            "veřejné RPC uzly a plánovač na Vercelu) a Tokenping je v betě bez záruky dostupnosti. Při prudkém propadu může health factor klesnout pod 1,0 mezi dvěma kontrolami. Zvolte proto dva kanály, nastavte práh s rezervou na reakci a nespoléhejte na upozornění jako na jedinou pojistku.",
          ),
        },
        {
          question: "Je moje pozice podporovaná?",
          answer: rich(
            `Aave V3 na sítích ${networkList}. Nepodporujeme: Aave V4 (k říjnu 2026 spuštěné na Ethereu, Avalanche, Arc a Base), ostatní trhy Aave V3 na Ethereu (Prime/Lido, EtherFi, Horizon), další sítě Aave ani jiné protokoly. Na každou síť máte jedno upozornění, pro peněženku, kterou připojíte.`,
          ),
        },
        {
          question: "Jak často mi upozornění přijde a jak ho zastavím?",
          answer: rich(
            `${capitalize(csEveryMinutes(minutes))} do každého zvoleného kanálu, dokud je váš health factor pod prahem. Upozornění přestanou chodit, když se health factor vrátí na práh nebo nad něj, nebo když upozornění smažete, k čemuž potřebujete aktivní přístup. Pokud vám přístup vypršel, napište nám na `,
            links.x("X"),
            " nebo do naší ",
            links.telegramCommunity("komunity na Telegramu"),
            " a upozornění smažeme.",
            hasTelegram ? " V Telegramu můžete botovi s upozorněními poslat také /stop." : "",
            " Odložení, zpráva „zpět nad prahem“ ani odkaz pro odhlášení v e-mailech zatím nejsou.",
          ),
        },
        {
          question: "Můžu sledovat peněženku, kterou nepřipojím, nebo více peněženek?",
          answer: rich(
            "Zatím ne. Tokenping hlídá peněženku, kterou připojíte, a přístup platí pro každou platící peněženku zvlášť.",
          ),
        },
        {
          question: "Jiné nástroje jsou zdarma. Proč platit?",
          answer: rich(
            "Pokud vám vyhovuje bot na Telegramu nebo mobilní aplikace a raději vložíte libovolnou adresu, než abyste připojovali peněženku, existují bezplatné nástroje",
            links.comparison
              ? rich(
                  ": popisuje je naše ",
                  links.comparison("srovnání nástrojů pro upozornění na likvidaci na Aave"),
                  ", včetně toho, v čem jsou lepší než Tokenping",
                )
              : null,
            ". Tokenping je pro ty, kdo chtějí upozornění přes Signal nebo e-mail, i pro pozice na sítích Gnosis a Optimism.",
          ),
        },
      ];
    },

    limitsTitle: "Omezení bez příkras",
    limits: ({ networks, minutes, paymentChain }) => [
      `Jen Aave V3 na ${networks} sítích, na Ethereu jen trh Core. Žádné Aave V4 ani jiné protokoly.`,
      `Kontroly probíhají ${csEveryMinutes(minutes)}, ne v reálném čase. Při rychlém propadu může být pozice zlikvidována mezi dvěma kontrolami.`,
      "Dokud jste pod prahem, každá kontrola pošle do každého kanálu další zprávu. Chybí odložení, souhrnná zpráva i zpráva o návratu nad práh.",
      "Jeden práh na síť, jen pro připojenou peněženku. Žádné adresy jen ke sledování, cenová upozornění ani upozornění na celé portfolio.",
      `Platí se jen v USDC${paymentChain ? ` na síti ${paymentChain}` : ""}: kartou zaplatit nelze a kontrakt nemá funkci pro vrácení peněz.`,
      "E-maily zatím nemají odkaz pro odhlášení a smazání upozornění vyžaduje aktivní přístup.",
      "Tokenping je v betě. Doručení závisí na službách třetích stran a dostupnost není zaručená.",
    ],

    blogTitle: "Z blogu",
    allGuides: "Všichni průvodci health factorem a likvidací na Aave",

    closingTitle: "Zkontrolujte svůj health factor na Aave V3 zdarma",
    closingLead: networks =>
      `Přehled ukáže kolaterál, dluh a health factor připojené peněženky na všech ${networks} sítích. Upozornění jsou volitelná a placená.`,
  },
};
