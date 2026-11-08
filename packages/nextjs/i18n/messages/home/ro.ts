import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal, plural } from "~~/i18n/format";

/** "30 de zile", "1 zi", "7 zile". */
const roDays = (days: number) =>
  plural("ro", days, { one: `${days} zi`, few: `${days} zile`, other: `${days} de zile` });

/** "la fiecare 5 minute", "la fiecare minut", "la fiecare 30 de minute". */
const roEveryMinutes = (minutes: number) =>
  plural("ro", minutes, {
    one: "la fiecare minut",
    few: `la fiecare ${minutes} minute`,
    other: `la fiecare ${minutes} de minute`,
  });

/** "29 de rețele", "1 rețea", "3 rețele". */
const roNetworks = (networks: number) =>
  plural("ro", networks, { one: `${networks} rețea`, few: `${networks} rețele`, other: `${networks} de rețele` });

/** "24 de piețe V3", "1 piață V3". */
const roV3Markets = (markets: number) =>
  plural("ro", markets, {
    one: `${markets} piață V3`,
    few: `${markets} piețe V3`,
    other: `${markets} de piețe V3`,
  });

/** "13 Spoke-uri V4", "1 Spoke V4", "20 de Spoke-uri V4". */
const roV4Spokes = (spokes: number) =>
  plural("ro", spokes, {
    one: `${spokes} Spoke V4`,
    few: `${spokes} Spoke-uri V4`,
    other: `${spokes} de Spoke-uri V4`,
  });

/** "pe Arbitrum One", or the payment network unnamed. */
const roOnChain = (chainName: string | undefined) => (chainName ? `pe ${chainName}` : "pe rețeaua de plată");

export const MESSAGES: HomeMessages = {
  headline: channels => `Alerte de health factor pentru Aave și Morpho prin ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Alerte prin ${channels} când health factor-ul tău pe Aave sau Morpho este sub prag, pe ${roNetworks(networks)}, ${roEveryMinutes(minutes)}.`
      : `Alerte prin ${channels} când health factor-ul tău pe Aave sau Morpho scade sub prag, pe ${roNetworks(networks)}. Verificat ${roEveryMinutes(minutes)}.`,
  channelBadge: capitalize,
  pricingCta: plan =>
    plan ? `Setează alertele: ${formatDecimal("ro", plan.priceLabel)} pentru ${roDays(plan.days)}` : "Setează alertele",
  offerDescription: ({ days, currency }) =>
    `Alerte de health factor pentru ${roDays(days)}, plătite în ${currency} din portofelul tău. Fără reînnoire automată.`,

  kicker: "Aave V3 și V4, Morpho Blue și Midnight",
  heroLead: ({ minutes, channels }) =>
    `Verificat ${roEveryMinutes(minutes)}. Un mesaj prin ${channels} cât timp ești sub pragul tău. Doar citire, fără aprobări.`,
  networksLabel: "Rețele",
  heroCoverage: networks => roNetworks(networks),
  channelsLabel: "Alerte prin:",
  exampleAlertLabel: "Ce spune o alertă",
  exampleAlertCaption: subject => `Exemplu. E-mailurile sosesc cu subiectul „${subject}”.`,

  dashboardCta: "Deschide panoul Aave",
  morphoDashboardCta: "Deschide panoul Morpho",
  dashboardCtaMicrocopy: alertPrice => `Conectează un portofel și vezi fiecare poziție. Alertele costă ${alertPrice}.`,

  problemTitle: "Health factor-ul scade în timp ce dormi",
  problemLead:
    "Aave îți arată health factor-ul, dar nu trimite alerte (octombrie 2026). Trei lucruri îl mișcă peste noapte:",
  problemCauses: [
    { title: "Prețurile scad", body: "ETH scade și garanția ta valorează mai puțin." },
    { title: "Dobânda se acumulează", body: "Datoria ta crește în fiecare secundă." },
    { title: "Pragurile se schimbă", body: "Pe Aave, guvernanța poate reduce un prag de lichidare." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Debitorii povestesc cum ",
      morning("s-au trezit cu poziția lichidată"),
      ", despre ",
      failedRepays("o oră de tranzacții de rambursare eșuate"),
      " și despre ",
      polygon("o rambursare la 1,01 care a venit prea târziu"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "Pe deasupra, lichidatorul păstrează un bonus: 5% pentru WETH pe piața Core de pe Ethereum (octombrie 2026).",
      guide && rich(" Vezi ", guide("cum funcționează o lichidare"), "."),
    ),
  chart: {
    threshold: "pragul tău",
    liquidation: "lichidare",
    alertSent: "Alertă trimisă",
    youCheck: "Te uiți pe telefon",
    caption:
      "O noapte de exemplu. Alerta pleacă la 03:05, la prima verificare sub 1,5, cu cinci ore înainte să te uiți.",
  },

  howItWorksTitle: "Cum funcționează",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` pe ${paymentChain}` : "";
    return [
      {
        title: "Conectează portofelul cu care te împrumuți",
        body: "Doar citire. Aave și Morpho, câte o pagină pentru fiecare.",
      },
      {
        title: plan
          ? `Deblochează alertele pentru ${formatDecimal("ro", plan.priceLabel)}`
          : "Deblochează alertele cu o plată mică în USDC",
        body: `${plan ? `Acces pentru ${roDays(plan.days)}, plătit` : "Plătit"} în USDC${paidOn}. Fără reînnoire automată.`,
      },
      {
        title: "Alege un prag pentru fiecare piață",
        body: `De la ${formatDecimal("ro", threshold.min)} (${formatDecimal("ro", morphoMin)} pe Morpho) până la ${formatDecimal("ro", threshold.max)}, implicit ${formatDecimal("ro", threshold.default)}.`,
      },
      {
        title: "Primești un mesaj cât timp ești sub el",
        body: `${capitalize(roEveryMinutes(minutes))}, prin ${channels}, până revii peste pragul tău.`,
      },
    ];
  },
  scaleTitle: "Unde să-ți pui pragul",
  scale: {
    liquidation: "lichidare",
    critical: "Critic",
    risky: "Riscant",
    safe: "Sigur",
    defaultThreshold: value => `Implicit ${value}`,
    below: value => `Sub ${value}`,
    between: (from, to) => `De la ${from} la ${to}`,
    andAbove: value => `${value} și peste`,
    range: (min, max) => `Orice valoare de la ${min} la ${max}.`,
  },
  scaleGuide: "Cum alegi un prag",

  coverageTitle: "Fiecare piață Aave și fiecare piață Morpho listată",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${roV3Markets(v3Markets)} Aave pe ${roNetworks(v3Networks)} și ${roV4Spokes(spokes)} Aave pe ${roNetworks(v4Networks)}, la 4 noiembrie 2026, plus fiecare piață Morpho listată pe ${roNetworks(morphoNetworks)}.`,
  coverage: {
    v3Markets: count => roV3Markets(count),
    v4Spokes: count => roV4Spokes(count),
    morpho: "Morpho",
  },
  coverageNote:
    "Scroll, ZKsync, Metis, Soneium și Sonic sunt închise treptat de guvernanța Aave și sunt încă urmărite. Nu sunt acoperite: Aave V3 pe Harmony, piețele Morpho nelistate și alte protocoale.",

  pricingTitle: "Prețuri",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Alerte", detail: capitalize(alertPrice) },
    { term: "Reînnoire", detail: "Nu este automată: plătești din nou când vrei mai mult timp" },
    {
      term: "Plată",
      detail: paymentChain
        ? `USDC pe ${paymentChain}, din portofelul tău (aprobi, apoi plătești)`
        : "USDC, din portofelul tău",
    },
  ],
  priceSource: "Prețul este citit din contractul de plată și actualizat în fiecare oră.",
  pricingFootnote: "Vizualizarea pozițiilor nu costă nimic.",

  questionsTitle: "Întrebări de pus înainte să conectezi un portofel",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = roOnChain(paymentChain);
    return [
      {
        question: "Poate Tokenping să-mi atingă fondurile?",
        answer: rich(
          `Nu. Tokenping doar îți citește pozițiile și nu cere niciodată o aprobare sau o semnătură pe Aave ori Morpho. Singurele tranzacții sunt plata ${onChain}: o aprobare pentru exact prețul, apoi plata. `,
          links.sourcify
            ? rich(
                "Contractul este ",
                links.sourcify("verificat pe Sourcify"),
                ", iar ",
                links.sourceCode("codul său sursă este public"),
              )
            : links.sourceCode("Codul sursă al contractului este public"),
          "; portofelul echipei îi poate schimba prețul, îl poate întrerupe și îl poate actualiza.",
        ),
      },
      {
        question: "Ce stocați?",
        answer: rich(
          "Adresa portofelului, alertele tale și datele de contact pe care ni le dai (e-mail, nume de utilizator Signal",
          hasTelegram ? ", chat Telegram" : "",
          `). Fără istoric și fără cookie-uri de urmărire; vizitele pe pagini sunt numărate anonim. Doar cineva care poate semna cu portofelul tău poate citi aceste date de contact, dar plățile sunt publice ${onChain}. `,
          links.privacy("Pagina de confidențialitate"),
          " are lista completă.",
        ),
      },
      {
        question: "Cât costă?",
        answer: rich(
          `Alertele costă ${alertPrice}, în USDC ${onChain}, plus puțin ETH pentru gas. Vizualizarea pozițiilor nu costă nimic. Fără reînnoire automată, fără rambursări.`,
        ),
      },
      {
        question: "Ce împrumuturi Morpho sunt acoperite?",
        answer: rich(
          `Împrumuturile Morpho Blue (dobândă variabilă) și Morpho Midnight (dobândă fixă) din piețele listate în aplicația Morpho, cu praguri de la ${formatDecimal("ro", morphoMin)}. Un împrumut cu dobândă fixă primește și mementouri înainte de scadență. Același plan le acoperă: deschide `,
          links.morphoDashboard("panoul Morpho"),
          ".",
        ),
      },
      {
        question: "Ce se întâmplă dacă o alertă nu ajunge?",
        answer: rich(
          `Următoarea verificare, ${plural("ro", minutes, { one: "un minut", few: `${minutes} minute`, other: `${minutes} de minute` })} mai târziu, încearcă din nou. Livrarea depinde de Resend, un releu Signal,`,
          hasTelegram ? " Telegram Bot API," : "",
          " noduri RPC publice și planificatorul Vercel, fără garanție de disponibilitate. Alege două canale și lasă-ți timp să acționezi.",
        ),
      },
      {
        question: "Cum opresc alertele?",
        answer: rich(
          "Se opresc când health factor-ul revine peste pragul tău sau când ștergi alerta (necesită acces activ). Ți-a expirat accesul? Scrie-ne pe ",
          links.x("X"),
          " sau în comunitatea noastră de pe ",
          links.telegramCommunity("Telegram"),
          " sau ",
          links.signalCommunity("Signal"),
          ".",
          hasTelegram ? " În Telegram funcționează și /stop." : "",
          " Deocamdată nu există amânare și nici link de dezabonare.",
        ),
      },
      {
        question: "Pot urmări un portofel pe care nu îl conectez?",
        answer: rich("Nu deocamdată. Un singur portofel, cel pe care îl conectezi; accesul este per portofel."),
      },
      {
        question: "Alte instrumente nu costă nimic. De ce să plătesc?",
        answer: rich(
          "Dacă ți se potrivește un bot Telegram sau o aplicație mobilă, folosește-l",
          links.comparison ? rich(": ", links.comparison("comparația noastră"), " le prezintă") : null,
          ". Tokenping este pentru alerte prin Signal sau e-mail, pe fiecare piață Aave și pe fiecare piață Morpho listată.",
        ),
      },
    ];
  },

  limitsTitle: "Limite, spuse direct",
  limits: ({ minutes, paymentChain, repeatMinutes }) => [
    `Verificare ${roEveryMinutes(minutes)}, nu continuu.`,
    `Sub pragul tău primești un mesaj la fiecare ${repeatMinutes} minute: fără amânare sau rezumat.`,
    "Un prag pe piață, doar pentru portofelul conectat.",
    `Doar USDC${paymentChain ? ` pe ${paymentChain}` : ""}: fără carduri, fără rambursări.`,
    "Deocamdată fără link de dezabonare în e-mailuri; ștergerea unei alerte necesită acces activ.",
    "Beta: livrare prin terți, fără garanție de disponibilitate.",
  ],

  blogTitle: "De pe blog",
  allGuides: "Toate ghidurile despre Aave și Morpho",

  closingTitle: "Setează-ți alerta de health factor pentru Aave sau Morpho",
  closingLead: alertPrice => `${capitalize(alertPrice)}, plătit din portofelul tău. Fără reînnoire automată.`,
};
