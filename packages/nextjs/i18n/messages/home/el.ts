import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal, plural } from "~~/i18n/format";

/** "30 ημέρες", "1 ημέρα". */
const elDays = (days: number) => plural("el", days, { one: `${days} ημέρα`, other: `${days} ημέρες` });

/** "κάθε 5 λεπτά", "κάθε λεπτό". */
const elEveryMinutes = (minutes: number) =>
  plural("el", minutes, { one: "κάθε λεπτό", other: `κάθε ${minutes} λεπτά` });

/** "29 δίκτυα", "1 δίκτυο". */
const elNetworks = (networks: number) =>
  plural("el", networks, { one: `${networks} δίκτυο`, other: `${networks} δίκτυα` });

/** "σε 29 δίκτυα", "σε 1 δίκτυο". */
const elOnNetworks = (networks: number) => `σε ${elNetworks(networks)}`;

/** "24 αγορές V3", "1 αγορά V3". */
const elV3Markets = (markets: number) =>
  plural("el", markets, { one: `${markets} αγορά V3`, other: `${markets} αγορές V3` });

/** "13 Spoke V4": Spoke stays in Latin letters and does not change in the plural. */
const elV4Spokes = (spokes: number) => `${spokes} Spoke V4`;

/** "στο δίκτυο Arbitrum One", or the payment network unnamed. */
const elOnChain = (chainName: string | undefined) => (chainName ? `στο δίκτυο ${chainName}` : "στο δίκτυο πληρωμής");

export const MESSAGES: HomeMessages = {
  headline: channels => `Ειδοποιήσεις health factor για Aave και Morpho μέσω ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Ειδοποιήσεις μέσω ${channels} όταν το health factor σας στο Aave ή στο Morpho είναι κάτω από το όριό σας, ${elOnNetworks(networks)}, ${elEveryMinutes(minutes)}.`
      : `Ειδοποιήσεις μέσω ${channels} όταν το health factor σας στο Aave ή στο Morpho πέσει κάτω από το όριό σας, ${elOnNetworks(networks)}. Έλεγχος ${elEveryMinutes(minutes)}.`,
  channelBadge: capitalize,
  pricingCta: plan =>
    plan
      ? `Ρυθμίστε ειδοποιήσεις: ${formatDecimal("el", plan.priceLabel)} για ${elDays(plan.days)}`
      : "Ρυθμίστε ειδοποιήσεις",
  offerDescription: ({ days, currency }) =>
    `Ειδοποιήσεις health factor για ${elDays(days)}, με πληρωμή σε ${currency} από το πορτοφόλι σας. Χωρίς αυτόματη ανανέωση.`,

  kicker: "Aave V3 και V4, Morpho Blue και Midnight",
  heroLead: ({ minutes, channels }) =>
    `Έλεγχος ${elEveryMinutes(minutes)}. Ένα μήνυμα μέσω ${channels} όσο είστε κάτω από το όριό σας. Μόνο ανάγνωση, χωρίς εγκρίσεις.`,
  networksLabel: "Δίκτυα",
  heroCoverage: networks => elNetworks(networks),
  channelsLabel: "Ειδοποιήσεις μέσω:",
  exampleAlertLabel: "Τι λέει μια ειδοποίηση",
  exampleAlertCaption: subject => `Παράδειγμα. Τα email φτάνουν με θέμα «${subject}».`,

  dashboardCta: "Άνοιγμα του πίνακα ελέγχου Aave",
  morphoDashboardCta: "Άνοιγμα του πίνακα ελέγχου Morpho",
  dashboardCtaMicrocopy: alertPrice =>
    `Συνδέστε πορτοφόλι και δείτε κάθε θέση. Οι ειδοποιήσεις κοστίζουν ${alertPrice}.`,

  problemTitle: "Το health factor πέφτει ενώ κοιμάστε",
  problemLead:
    "Το Aave δείχνει το health factor (δείκτης υγείας) σας, αλλά δεν στέλνει ειδοποιήσεις (Οκτώβριος 2026). Τρία πράγματα το μετακινούν μέσα στη νύχτα:",
  problemCauses: [
    { title: "Οι τιμές πέφτουν", body: "Το ETH πέφτει και η εξασφάλισή σας αξίζει λιγότερο." },
    { title: "Οι τόκοι συσσωρεύονται", body: "Το χρέος σας μεγαλώνει κάθε δευτερόλεπτο." },
    { title: "Τα όρια αλλάζουν", body: "Στο Aave, η διακυβέρνηση μπορεί να μειώσει ένα όριο ρευστοποίησης." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Δανειολήπτες περιγράφουν ",
      morning("πώς ξύπνησαν με τη θέση τους ρευστοποιημένη"),
      ", ",
      failedRepays("μία ώρα αποτυχημένων συναλλαγών αποπληρωμής"),
      " και ",
      polygon("μια αποπληρωμή στο 1,01 που ήρθε πολύ αργά"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "Επιπλέον, ο ρευστοποιητής κρατά ένα μπόνους: 5% στο WETH στην αγορά Ethereum Core (Οκτώβριος 2026).",
      guide && rich(" Δείτε ", guide("πώς λειτουργεί μια ρευστοποίηση"), "."),
    ),
  chart: {
    threshold: "το όριό σας",
    liquidation: "ρευστοποίηση",
    alertSent: "Η ειδοποίηση στάλθηκε",
    youCheck: "Κοιτάτε το κινητό σας",
    caption:
      "Μια νύχτα για παράδειγμα. Η ειδοποίηση φεύγει στις 03:05, στον πρώτο έλεγχο κάτω από 1,5, πέντε ώρες πριν κοιτάξετε.",
  },

  howItWorksTitle: "Πώς λειτουργεί",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` στο δίκτυο ${paymentChain}` : "";
    return [
      {
        title: "Συνδέστε το πορτοφόλι με το οποίο δανείζεστε",
        body: "Μόνο ανάγνωση. Aave και Morpho, μία σελίδα για το καθένα.",
      },
      {
        title: plan
          ? `Ξεκλειδώστε τις ειδοποιήσεις για ${formatDecimal("el", plan.priceLabel)}`
          : "Ξεκλειδώστε τις ειδοποιήσεις με μια μικρή πληρωμή σε USDC",
        body: `${plan ? `${capitalize(elDays(plan.days))} πρόσβασης, με πληρωμή` : "Πληρωμή"} σε USDC${paidOn}. Χωρίς αυτόματη ανανέωση.`,
      },
      {
        title: "Επιλέξτε ένα όριο για κάθε αγορά",
        body: `Από ${formatDecimal("el", threshold.min)} (${formatDecimal("el", morphoMin)} στο Morpho) έως ${formatDecimal("el", threshold.max)}, με προεπιλογή ${formatDecimal("el", threshold.default)}.`,
      },
      {
        title: "Λάβετε μήνυμα όσο είστε κάτω από αυτό",
        body: `${capitalize(elEveryMinutes(minutes))}, μέσω ${channels}, μέχρι να επιστρέψετε πάνω από το όριό σας.`,
      },
    ];
  },
  scaleTitle: "Πού να βάλετε το όριό σας",
  scale: {
    liquidation: "ρευστοποίηση",
    critical: "Κρίσιμο",
    risky: "Επικίνδυνο",
    safe: "Ασφαλές",
    defaultThreshold: value => `Προεπιλογή: ${value}`,
    below: value => `Κάτω από ${value}`,
    between: (from, to) => `${from} έως ${to}`,
    andAbove: value => `${value} και πάνω`,
    range: (min, max) => `Οποιαδήποτε τιμή από ${min} έως ${max}.`,
  },
  scaleGuide: "Πώς να επιλέξετε όριο",

  coverageTitle: "Κάθε αγορά του Aave και κάθε καταχωρισμένη αγορά του Morpho",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${elV3Markets(v3Markets)} του Aave ${elOnNetworks(v3Networks)} και ${elV4Spokes(spokes)} του Aave ${elOnNetworks(v4Networks)}, στις 4 Νοεμβρίου 2026, καθώς και κάθε καταχωρισμένη αγορά του Morpho ${elOnNetworks(morphoNetworks)}.`,
  coverage: {
    v3Markets: count => elV3Markets(count),
    v4Spokes: count => elV4Spokes(count),
    morpho: "Morpho",
  },
  coverageNote:
    "Τα Scroll, ZKsync, Metis, Soneium και Sonic καταργούνται σταδιακά από τη διακυβέρνηση του Aave και εξακολουθούν να παρακολουθούνται. Δεν καλύπτονται: το Aave V3 στο Harmony, οι μη καταχωρισμένες αγορές του Morpho και άλλα πρωτόκολλα.",

  pricingTitle: "Τιμές",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Ειδοποιήσεις", detail: capitalize(alertPrice) },
    { term: "Ανανέωση", detail: "Καμία αυτόματη: πληρώνετε ξανά όταν θέλετε περισσότερο χρόνο" },
    {
      term: "Πληρωμή",
      detail: paymentChain
        ? `USDC στο δίκτυο ${paymentChain}, από το πορτοφόλι σας (έγκριση, μετά πληρωμή)`
        : "USDC, από το πορτοφόλι σας",
    },
  ],
  priceSource: "Η τιμή διαβάζεται από το συμβόλαιο πληρωμής και ανανεώνεται κάθε ώρα.",
  pricingFootnote: "Για να δείτε τις θέσεις σας δεν πληρώνετε τίποτα.",

  questionsTitle: "Ερωτήσεις πριν συνδέσετε πορτοφόλι",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = elOnChain(paymentChain);
    return [
      {
        question: "Μπορεί το Tokenping να αγγίξει τα κεφάλαιά μου;",
        answer: rich(
          `Όχι. Το Tokenping μόνο διαβάζει τις θέσεις σας και δεν ζητά ποτέ έγκριση ή υπογραφή στο Aave ή στο Morpho. Οι μόνες συναλλαγές είναι η πληρωμή ${onChain}: μια έγκριση για ακριβώς το ποσό της τιμής και μετά η πληρωμή. `,
          links.sourcify
            ? rich(
                "Το συμβόλαιο είναι ",
                links.sourcify("επαληθευμένο στο Sourcify"),
                " και ο ",
                links.sourceCode("πηγαίος κώδικάς του είναι δημόσιος"),
              )
            : links.sourceCode("Ο πηγαίος κώδικας του συμβολαίου είναι δημόσιος"),
          "· το πορτοφόλι της ομάδας μπορεί να αλλάξει την τιμή του, να το θέσει σε παύση και να το αναβαθμίσει.",
        ),
      },
      {
        question: "Τι αποθηκεύετε;",
        answer: rich(
          "Τη διεύθυνση του πορτοφολιού σας, τις ειδοποιήσεις σας και τα στοιχεία επικοινωνίας που δίνετε (email, όνομα χρήστη Signal",
          hasTelegram ? ", συνομιλία Telegram" : "",
          `). Κανένα ιστορικό και κανένα cookie παρακολούθησης· οι προβολές σελίδων μετρώνται ανώνυμα. Μόνο όποιος μπορεί να υπογράψει με το πορτοφόλι σας μπορεί να διαβάσει αυτά τα στοιχεία επικοινωνίας, αλλά οι πληρωμές είναι δημόσιες ${onChain}. Η `,
          links.privacy("σελίδα απορρήτου"),
          " έχει την πλήρη λίστα.",
        ),
      },
      {
        question: "Πόσο κοστίζει;",
        answer: rich(
          `Οι ειδοποιήσεις κοστίζουν ${alertPrice}, σε USDC ${onChain}, συν λίγο ETH για gas. Για να δείτε τις θέσεις σας δεν πληρώνετε τίποτα. Χωρίς αυτόματη ανανέωση, χωρίς επιστροφές χρημάτων.`,
        ),
      },
      {
        question: "Ποια δάνεια του Morpho καλύπτονται;",
        answer: rich(
          `Δάνεια Morpho Blue (κυμαινόμενο επιτόκιο) και Morpho Midnight (σταθερό επιτόκιο) στις αγορές που εμφανίζει η εφαρμογή του Morpho, με όρια από ${formatDecimal("el", morphoMin)}. Ένα δάνειο σταθερού επιτοκίου λαμβάνει επίσης υπενθυμίσεις πριν από τη λήξη του. Το ίδιο πρόγραμμα τα καλύπτει: ανοίξτε τον `,
          links.morphoDashboard("πίνακα ελέγχου Morpho"),
          ".",
        ),
      },
      {
        question: "Τι γίνεται αν μια ειδοποίηση δεν φτάσει;",
        answer: rich(
          `Ο επόμενος έλεγχος, ${plural("el", minutes, { one: `${minutes} λεπτό`, other: `${minutes} λεπτά` })} αργότερα, δοκιμάζει ξανά. Η αποστολή βασίζεται στο Resend, σε ένα relay του Signal,`,
          hasTelegram ? " στο Telegram Bot API," : "",
          " σε δημόσιους κόμβους RPC και στον χρονοπρογραμματιστή της Vercel, χωρίς εγγύηση διαθεσιμότητας. Επιλέξτε δύο κανάλια και αφήστε περιθώριο για να ενεργήσετε.",
        ),
      },
      {
        question: "Πώς σταματώ τις ειδοποιήσεις;",
        answer: rich(
          "Σταματούν μόλις το health factor σας επιστρέψει πάνω από το όριό σας ή όταν διαγράψετε την ειδοποίηση (χρειάζεται ενεργή πρόσβαση). Έληξε η πρόσβαση; Στείλτε μας μήνυμα στο ",
          links.x("X"),
          " ή στην κοινότητά μας στο ",
          links.telegramCommunity("Telegram"),
          " ή στο ",
          links.signalCommunity("Signal"),
          ".",
          hasTelegram ? " Στο Telegram λειτουργεί και το /stop." : "",
          " Δεν υπάρχει ακόμη αναβολή ούτε σύνδεσμος διαγραφής από τη λίστα.",
        ),
      },
      {
        question: "Μπορώ να παρακολουθώ ένα πορτοφόλι που δεν συνδέω;",
        answer: rich("Όχι προς το παρόν. Ένα πορτοφόλι, αυτό που συνδέετε· η πρόσβαση ισχύει ανά πορτοφόλι."),
      },
      {
        question: "Άλλα εργαλεία δεν κοστίζουν τίποτα. Γιατί να πληρώσω;",
        answer: rich(
          "Αν σας εξυπηρετεί ένα bot στο Telegram ή μια εφαρμογή για κινητό, χρησιμοποιήστε το",
          links.comparison ? rich(": ", links.comparison("η σύγκρισή μας"), " τα παρουσιάζει") : null,
          ". Το Tokenping είναι για ειδοποιήσεις μέσω Signal ή email, σε κάθε αγορά του Aave και κάθε καταχωρισμένη αγορά του Morpho.",
        ),
      },
    ];
  },

  limitsTitle: "Τα όρια, με απλά λόγια",
  limits: ({ minutes, paymentChain, repeatMinutes }) => [
    `Έλεγχος ${elEveryMinutes(minutes)}, όχι συνεχώς.`,
    `Κάτω από το όριό σας λαμβάνετε μήνυμα κάθε ${repeatMinutes} λεπτά: χωρίς αναβολή ή σύνοψη.`,
    "Ένα όριο ανά αγορά, μόνο για το συνδεδεμένο πορτοφόλι.",
    `Μόνο USDC${paymentChain ? ` στο δίκτυο ${paymentChain}` : ""}: χωρίς κάρτες, χωρίς επιστροφές χρημάτων.`,
    "Τα email δεν έχουν ακόμη σύνδεσμο διαγραφής από τη λίστα· η διαγραφή μιας ειδοποίησης χρειάζεται ενεργή πρόσβαση.",
    "Beta: αποστολή μέσω τρίτων υπηρεσιών, χωρίς εγγύηση διαθεσιμότητας.",
  ],

  blogTitle: "Από το ιστολόγιο",
  allGuides: "Όλοι οι οδηγοί για Aave και Morpho",

  closingTitle: "Ρυθμίστε την ειδοποίηση health factor για Aave ή Morpho",
  closingLead: alertPrice => `${capitalize(alertPrice)}, με πληρωμή από το πορτοφόλι σας. Χωρίς αυτόματη ανανέωση.`,
};
