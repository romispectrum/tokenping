import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal, plural } from "~~/i18n/format";

/** "30 giorni", "1 giorno". */
const itDays = (days: number) =>
  plural("it", days, { one: `${days} giorno`, many: `${days} di giorni`, other: `${days} giorni` });

/** "ogni 5 minuti", "ogni minuto". */
const itEveryMinutes = (minutes: number) =>
  plural("it", minutes, { one: "ogni minuto", many: `ogni ${minutes} minuti`, other: `ogni ${minutes} minuti` });

/** "29 reti", "1 rete". */
const itNetworks = (networks: number) =>
  plural("it", networks, { one: `${networks} rete`, many: `${networks} di reti`, other: `${networks} reti` });

/** "su 29 reti", "su 1 rete". */
const itOnNetworks = (networks: number) => `su ${itNetworks(networks)}`;

/** "24 mercati V3", "1 mercato V3". */
const itV3Markets = (markets: number) =>
  plural("it", markets, {
    one: `${markets} mercato V3`,
    many: `${markets} mercati V3`,
    other: `${markets} mercati V3`,
  });

/** "13 Spoke V4": Spoke does not change in the plural. */
const itV4Spokes = (spokes: number) => `${spokes} Spoke V4`;

/** "su Arbitrum One", or the payment network unnamed. */
const itOnChain = (chainName: string | undefined) => (chainName ? `su ${chainName}` : "sulla rete di pagamento");

export const MESSAGES: HomeMessages = {
  headline: channels => `Avvisi sul fattore di salute di Aave e Morpho via ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Avvisi via ${channels} quando il tuo fattore di salute su Aave o Morpho è sotto la tua soglia, ${itOnNetworks(networks)}, ${itEveryMinutes(minutes)}.`
      : `Avvisi via ${channels} quando il tuo fattore di salute su Aave o Morpho scende sotto la tua soglia, ${itOnNetworks(networks)}. Controllo ${itEveryMinutes(minutes)}.`,
  channelBadge: capitalize,
  pricingCta: plan =>
    plan
      ? `Configura gli avvisi: ${formatDecimal("it", plan.priceLabel)} per ${itDays(plan.days)}`
      : "Configura gli avvisi",
  offerDescription: ({ days, currency }) =>
    `Avvisi sul fattore di salute per ${itDays(days)}, pagati in ${currency} dal tuo wallet. Nessun rinnovo automatico.`,

  kicker: "Aave V3 e V4, Morpho Blue e Midnight",
  heroLead: ({ minutes, channels }) =>
    `Controllo ${itEveryMinutes(minutes)}. Un messaggio via ${channels} finché sei sotto la tua soglia. In sola lettura, nessuna approvazione.`,
  networksLabel: "Reti",
  heroCoverage: networks => itNetworks(networks),
  channelsLabel: "Avvisi via:",
  exampleAlertLabel: "Cosa dice un avviso",
  exampleAlertCaption: subject => `Esempio. Le email arrivano con l'oggetto «${subject}».`,

  dashboardCta: "Apri la dashboard Aave",
  morphoDashboardCta: "Apri la dashboard Morpho",
  dashboardCtaMicrocopy: alertPrice => `Collega un wallet e vedi ogni posizione. Gli avvisi costano ${alertPrice}.`,

  problemTitle: "Il fattore di salute scende mentre dormi",
  problemLead:
    "Aave mostra il tuo fattore di salute ma non invia avvisi (ottobre 2026). Tre cose lo muovono durante la notte:",
  problemCauses: [
    { title: "I prezzi scendono", body: "ETH cala e il tuo collaterale vale meno." },
    { title: "Gli interessi maturano", body: "Il tuo debito cresce ogni secondo." },
    { title: "Le soglie cambiano", body: "Su Aave, la governance può abbassare una soglia di liquidazione." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Chi prende in prestito racconta di ",
      morning("essersi svegliato con una posizione liquidata"),
      ", di ",
      failedRepays("un'ora di transazioni di rimborso fallite"),
      " e di ",
      polygon("un rimborso a 1,01 arrivato troppo tardi"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "In più il liquidatore si tiene un bonus: 5% sul WETH nel mercato Core di Ethereum (ottobre 2026).",
      guide && rich(" Leggi ", guide("come funziona una liquidazione"), "."),
    ),
  chart: {
    threshold: "la tua soglia",
    liquidation: "liquidazione",
    alertSent: "Avviso inviato",
    youCheck: "Guardi il telefono",
    caption:
      "Una notte di esempio. L'avviso parte alle 03:05, al primo controllo sotto 1,5, cinque ore prima che tu guardi.",
  },

  howItWorksTitle: "Come funziona",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` su ${paymentChain}` : "";
    return [
      {
        title: "Collega il wallet con cui prendi in prestito",
        body: "In sola lettura. Aave e Morpho, una pagina ciascuno.",
      },
      {
        title: plan
          ? `Sblocca gli avvisi per ${formatDecimal("it", plan.priceLabel)}`
          : "Sblocca gli avvisi con un piccolo pagamento in USDC",
        body: `${plan ? `${capitalize(itDays(plan.days))} di accesso, pagati` : "Pagamento"} in USDC${paidOn}. Nessun rinnovo automatico.`,
      },
      {
        title: "Scegli una soglia per ogni mercato",
        body: `Da ${formatDecimal("it", threshold.min)} (${formatDecimal("it", morphoMin)} su Morpho) a ${formatDecimal("it", threshold.max)}, predefinita ${formatDecimal("it", threshold.default)}.`,
      },
      {
        title: "Ricevi un messaggio finché sei sotto",
        body: `${capitalize(itEveryMinutes(minutes))}, via ${channels}, finché non torni sopra la tua soglia.`,
      },
    ];
  },
  scaleTitle: "Dove mettere la tua soglia",
  scale: {
    liquidation: "liquidazione",
    critical: "Critico",
    risky: "A rischio",
    safe: "Sicuro",
    defaultThreshold: value => `Predefinita: ${value}`,
    below: value => `Sotto ${value}`,
    between: (from, to) => `Da ${from} a ${to}`,
    andAbove: value => `${value} e oltre`,
    range: (min, max) => `Qualsiasi valore da ${min} a ${max}.`,
  },
  scaleGuide: "Come scegliere una soglia",

  coverageTitle: "Ogni mercato Aave e ogni mercato Morpho elencato",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${itV3Markets(v3Markets)} di Aave ${itOnNetworks(v3Networks)} e ${itV4Spokes(spokes)} di Aave ${itOnNetworks(v4Networks)}, al 4 novembre 2026, più ogni mercato Morpho elencato ${itOnNetworks(morphoNetworks)}.`,
  coverage: {
    v3Markets: count => itV3Markets(count),
    v4Spokes: count => itV4Spokes(count),
    morpho: "Morpho",
  },
  coverageNote:
    "Scroll, ZKsync, Metis, Soneium e Sonic sono in fase di chiusura da parte della governance di Aave e restano monitorati. Non coperti: Aave V3 su Harmony, i mercati Morpho non elencati e gli altri protocolli.",

  pricingTitle: "Prezzi",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Avvisi", detail: capitalize(alertPrice) },
    { term: "Rinnovo", detail: "Mai automatico: paga di nuovo quando vuoi più tempo" },
    {
      term: "Pagamento",
      detail: paymentChain ? `USDC su ${paymentChain}, dal tuo wallet (approva, poi paga)` : "USDC, dal tuo wallet",
    },
  ],
  priceSource: "Il prezzo viene letto dal contratto di pagamento e aggiornato ogni ora.",
  pricingFootnote: "Vedere le tue posizioni non richiede pagamenti.",

  questionsTitle: "Le domande da fare prima di collegare un wallet",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = itOnChain(paymentChain);
    return [
      {
        question: "Tokenping può toccare i miei fondi?",
        answer: rich(
          `No. Tokenping legge soltanto le tue posizioni e non chiede mai un'approvazione o una firma su Aave o Morpho. Le uniche transazioni sono il pagamento ${onChain}: un'approvazione per l'importo esatto del prezzo, poi il pagamento. `,
          links.sourcify
            ? rich(
                "Il contratto è ",
                links.sourcify("verificato su Sourcify"),
                " e il suo ",
                links.sourceCode("codice sorgente è pubblico"),
              )
            : links.sourceCode("Il codice sorgente del contratto è pubblico"),
          "; il wallet del team può cambiarne il prezzo, metterlo in pausa e aggiornarlo.",
        ),
      },
      {
        question: "Cosa salvate?",
        answer: rich(
          "L'indirizzo del tuo wallet, i tuoi avvisi e i recapiti che indichi (email, nome utente Signal",
          hasTelegram ? ", chat Telegram" : "",
          `). Nessuno storico e nessun cookie di tracciamento; le visite alle pagine sono contate in forma anonima. Solo chi può firmare con il tuo wallet può leggere quei recapiti, ma i pagamenti sono pubblici ${onChain}. La `,
          links.privacy("pagina sulla privacy"),
          " ha l'elenco completo.",
        ),
      },
      {
        question: "Quanto costa?",
        answer: rich(
          `Gli avvisi costano ${alertPrice}, in USDC ${onChain}, più un po' di ETH per il gas. Vedere le tue posizioni non richiede pagamenti. Nessun rinnovo automatico, nessun rimborso.`,
        ),
      },
      {
        question: "Quali prestiti Morpho sono coperti?",
        answer: rich(
          `I prestiti Morpho Blue (tasso variabile) e Morpho Midnight (tasso fisso) nei mercati elencati dall'app Morpho, con soglie da ${formatDecimal("it", morphoMin)}. Un prestito a tasso fisso riceve anche promemoria prima della scadenza. Lo stesso piano li copre: apri la `,
          links.morphoDashboard("dashboard Morpho"),
          ".",
        ),
      },
      {
        question: "E se un avviso non arriva?",
        answer: rich(
          `Il controllo successivo, ${plural("it", minutes, { one: `${minutes} minuto`, many: `${minutes} di minuti`, other: `${minutes} minuti` })} dopo, ci riprova. L'invio si appoggia a Resend, a un relay Signal,`,
          hasTelegram ? " alla Telegram Bot API," : "",
          " a nodi RPC pubblici e allo scheduler di Vercel, senza garanzia di disponibilità. Scegli due canali e lasciati margine per agire.",
        ),
      },
      {
        question: "Come fermo gli avvisi?",
        answer: rich(
          "Si fermano quando il tuo fattore di salute torna sopra la tua soglia, oppure quando elimini l'avviso (serve l'accesso attivo). Accesso scaduto? Scrivici su ",
          links.x("X"),
          " o nella nostra community su ",
          links.telegramCommunity("Telegram"),
          " o ",
          links.signalCommunity("Signal"),
          ".",
          hasTelegram ? " In Telegram funziona anche /stop." : "",
          " Non ci sono ancora né pausa né link di disiscrizione.",
        ),
      },
      {
        question: "Posso monitorare un wallet che non collego?",
        answer: rich("Per ora no. Un solo wallet, quello che colleghi; l'accesso è legato al wallet."),
      },
      {
        question: "Altri strumenti non costano nulla. Perché pagare?",
        answer: rich(
          "Se ti basta un bot Telegram o un'app mobile, usali",
          links.comparison ? rich(": ", links.comparison("il nostro confronto"), " li presenta") : null,
          ". Tokenping serve per gli avvisi via Signal o email, in ogni mercato Aave e in ogni mercato Morpho elencato.",
        ),
      },
    ];
  },

  limitsTitle: "I limiti, detti chiaramente",
  limits: ({ minutes, paymentChain, repeatMinutes }) => [
    `Controllo ${itEveryMinutes(minutes)}, non continuo.`,
    `Sotto la tua soglia ricevi un messaggio ogni ${repeatMinutes} minuti: niente pausa né riepilogo.`,
    "Una soglia per mercato, solo per il wallet collegato.",
    `Solo USDC${paymentChain ? ` su ${paymentChain}` : ""}: niente carte, niente rimborsi.`,
    "Le email non hanno ancora un link di disiscrizione; eliminare un avviso richiede l'accesso attivo.",
    "Beta: invio tramite servizi terzi, senza garanzia di disponibilità.",
  ],

  blogTitle: "Dal blog",
  allGuides: "Tutte le guide su Aave e Morpho",

  closingTitle: "Configura il tuo avviso sul fattore di salute di Aave o Morpho",
  closingLead: alertPrice => `${capitalize(alertPrice)}, pagati dal tuo wallet. Nessun rinnovo automatico.`,
};
