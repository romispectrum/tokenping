import type { DashboardMessages } from "./shared";
import { elForMarket, elOnMarket, plural } from "~~/i18n/format";

/** "30 ημέρες", "1 ημέρα". */
const elDays = (days: number) => plural("el", days, { one: `${days} ημέρα`, other: `${days} ημέρες` });

export const MESSAGES: DashboardMessages = {
  page: {
    metaTitle: "Θέσεις Aave V3 και V4 και health factor",
    metaDescription: (networkCount, channels) =>
      `Δείτε εξασφάλιση, χρέος και health factor στο Aave V3 και V4 ${plural("el", networkCount, { one: `σε ${networkCount} δίκτυο`, other: `σε ${networkCount} δίκτυα` })} και ορίστε ειδοποιήσεις μέσω ${channels}, ένα όριο ανά αγορά.`,
    title: "Θέσεις Aave V3 και V4 και ειδοποιήσεις health factor",
    networkMarkets: (name, markets) => `${name} (αγορές ${markets})`,
    intro: (v3Networks, v4Networks) =>
      `Συνδέστε το πορτοφόλι με το οποίο δανείζεστε για να δείτε την εξασφάλιση, το χρέος και το health factor (δείκτης υγείας) του στο Aave V3 στα δίκτυα ${v3Networks}, και σε κάθε Spoke του Aave V4 στα δίκτυα ${v4Networks}. Η προβολή δεν απαιτεί καμία συναλλαγή.`,
    disclosureSummary: "Πόσο κοστίζουν οι ειδοποιήσεις και πόσο συχνά ελέγχουμε",
    alertsCost: (channels, paymentChain) =>
      `Για να λαμβάνετε μήνυμα μέσω ${channels} όταν το health factor μιας αγοράς πέσει κάτω από ένα όριο που επιλέγετε, ξεκλειδώστε τις ειδοποιήσεις με πληρωμή σε USDC${paymentChain ? ` στο δίκτυο ${paymentChain}` : ""}. Η τρέχουσα τιμή εμφανίζεται πριν πληρώσετε.`,
    checks: (minutes, repeatMinutes) =>
      `Το Tokenping ελέγχει ${plural("el", minutes, { one: "κάθε λεπτό", other: `κάθε ${minutes} λεπτά` })}. Όσο το health factor μένει κάτω από το όριό σας, λαμβάνετε μήνυμα κάθε ${repeatMinutes} λεπτά σε κάθε κανάλι που επιλέξατε.`,
    guideThreshold: "Πώς να επιλέξετε όριο",
    guideAlerts: "Πώς λειτουργούν οι ειδοποιήσεις",
    morphoDashboard: "Δανείζεστε στο Morpho; Ανοίξτε τον πίνακα ελέγχου Morpho",
  },
  gate: {
    title: "Συνδέστε πορτοφόλι για να συνεχίσετε",
    description:
      "Το Tokenping χρειάζεται τη διεύθυνση του πορτοφολιού σας για να εμφανίσει τις θέσεις σας στο Aave. Η σύνδεση δεν μετακινεί κεφάλαια και δεν χρεώνει κανένα τέλος.",
    connect: "Συνδέστε πορτοφόλι",
    connecting: "Σύνδεση",
    approveInWallet: "Εγκρίνετε τη σύνδεση στο πορτοφόλι σας.",
  },
  positionsHeading: "Οι θέσεις σας στο Aave",
  loadingDashboard: "Φόρτωση του πίνακα ελέγχου",
  toolbar: {
    wallet: "Πορτοφόλι",
    refresh: "Ανανέωση θέσεων",
    refreshing: "Ανανέωση",
    loadingPositions: "Φόρτωση θέσεων",
  },
  errors: {
    positionsDidNotLoad: "Οι θέσεις δεν φορτώθηκαν",
    refreshFailed: "Η ανανέωση απέτυχε",
    showingLastPositions: "Εμφανίζονται οι θέσεις από την τελευταία επιτυχημένη φόρτωση.",
    tryAgain: "Δοκιμάστε ξανά",
    fetchPositionsFailed: "Δεν ήταν δυνατή η λήψη των θέσεων Aave",
  },
  totals: {
    supplied: "Σύνολο κατατεθειμένων",
    borrowed: "Σύνολο δανεισμένων",
    netWorth: "Καθαρή αξία",
    noData: "Χωρίς δεδομένα",
  },
  networks: {
    heading: "Αγορές",
    active: count => plural("el", count, { one: `${count} ενεργή`, other: `${count} ενεργές` }),
    noPositions: "Δεν εντοπίστηκαν ενεργές θέσεις Aave στις υποστηριζόμενες αγορές.",
    selectedRegion: "Επιλεγμένη αγορά",
    noneSelectedTitle: "Δεν έχει επιλεγεί αγορά",
    noneSelectedDescription: "Επιλέξτε μια αγορά για να δείτε τη θέση σας στο Aave.",
    otherMarkets: count => `Άλλες αγορές (${count})`,
    otherMarketsHint: "Αγορές που έλεγξε το Tokenping όπου αυτό το πορτοφόλι δεν έχει θέση ούτε ειδοποίηση.",
    alertSet: "Ειδοποίηση ενεργή",
    supplied: usd => `${usd} κατατεθειμένα,`,
    borrowed: usd => `${usd} δανεισμένα`,
    noPosition: "Χωρίς θέση",
  },
  healthFactor: {
    srPrefix: "Health factor ",
    noDebt: "Χωρίς χρέος",
    critical: "Κρίσιμο",
    risky: "Επικίνδυνο",
    safe: "Ασφαλές",
  },
  position: {
    market: version => (version === 4 ? "Spoke του Aave V4" : "Αγορά του Aave V3"),
    noPositionTitle: chainName => `Καμία ενεργή θέση ${elOnMarket(chainName)}`,
    noPositionDetail: chainName =>
      `Το Aave δεν αναφέρει ούτε εξασφάλιση ούτε χρέος για αυτό το πορτοφόλι ${elOnMarket(chainName)}.`,
    collateral: "Εξασφάλιση",
    debt: "Χρέος",
    netWorth: "Καθαρή αξία",
    suppliedTitle: "Κατατεθειμένα",
    borrowedTitle: "Δανεισμένα",
    noCollateral: "Δεν έχει κατατεθεί εξασφάλιση",
    noDebt: "Δεν υπάρχει ανεξόφλητο χρέος",
    tokenIconsFrom: "Εικονίδια token και δικτύων από",
    tokenDetailsFailedTitle: "Τα στοιχεία των token δεν φορτώθηκαν",
    tokenDetailsFailedBody:
      "Τα παραπάνω σύνολα προέρχονται από τη σύνοψη λογαριασμού του Aave. Ανανεώστε τις θέσεις για να δοκιμάσετε ξανά.",
  },
  tokens: {
    asset: "Στοιχείο",
    supplied: "Κατατεθειμένα",
    supplyApy: "APY κατάθεσης",
    collateral: "Εξασφάλιση",
    borrowed: "Δανεισμένα",
    rateType: "Τύπος επιτοκίου",
    enabled: "Ενεργή",
    disabled: "Ανενεργή",
    stable: amount => `Σταθερό ${amount}`,
    variable: amount => `Κυμαινόμενο ${amount}`,
    count: count => plural("el", count, { one: `${count} στοιχείο`, other: `${count} στοιχεία` }),
  },
  address: {
    defaultLabel: "Διεύθυνση",
    copy: (_label, address) => `Αντιγραφή της διεύθυνσης ${address}`,
    copied: "Η διεύθυνση αντιγράφηκε",
    copyFailed: "Η αντιγραφή απέτυχε. Επιλέξτε τη διεύθυνση και αντιγράψτε τη χειροκίνητα.",
  },
  opensInNewTab: "(ανοίγει σε νέα καρτέλα)",
  paywall: {
    unlockedUntil: date => `Ειδοποιήσεις ξεκλειδωμένες έως τις ${date}`,
    titleNew: "Ξεκλειδώστε τις ειδοποιήσεις health factor",
    titleExtend: "Παρατείνετε την πρόσβαση για να επεξεργαστείτε τις ειδοποιήσεις σας",
    descriptionNew:
      "Πληρώστε μία φορά για να ξεκλειδώσετε τις ρυθμίσεις ειδοποιήσεων και να ορίσετε ένα όριο health factor για κάθε δίκτυο. Τίποτα δεν ανανεώνεται αυτόματα: πληρώνετε από το πορτοφόλι σας όταν θέλετε να παρατείνετε.",
    descriptionExtend:
      "Οι προηγούμενες ρυθμίσεις ειδοποιήσεών σας είναι αποθηκευμένες. Πληρώστε ξανά για να παρατείνετε την πρόσβαση και να τις επεξεργαστείτε.",
    networkDescriptionNew: chainName =>
      `Πληρώστε μία φορά για να ορίσετε ειδοποιήσεις health factor ${elOnMarket(chainName)} και σε άλλες αγορές. Τίποτα δεν ανανεώνεται αυτόματα: πληρώνετε από το πορτοφόλι σας όταν θέλετε να παρατείνετε.`,
    networkDescriptionExtend: chainName =>
      `Οι αποθηκευμένες ρυθμίσεις ειδοποίησης ${elForMarket(chainName)} βρίσκονται ακόμη στον λογαριασμό σας. Πληρώστε ξανά για να παρατείνετε την πρόσβαση και να τις επεξεργαστείτε.`,
    connectWallet: "Συνδέστε το πορτοφόλι σας για να πληρώσετε την πρόσβαση.",
    unconfigured: "Το συμβόλαιο πληρωμής δεν έχει ρυθμιστεί για αυτό το δίκτυο.",
    noPlan: "Δεν υπάρχει διαθέσιμο πρόγραμμα επί πληρωμή αυτή τη στιγμή.",
    paused: "Οι πληρωμές έχουν ανασταλεί προσωρινά. Δοκιμάστε ξανά αργότερα.",
    statusUnavailable:
      "Δεν ήταν δυνατή η φόρτωση της κατάστασης πληρωμής. Φορτώστε ξανά τη σελίδα για να δοκιμάσετε ξανά.",
    wrongNetworkTitle: "Λάθος δίκτυο",
    wrongNetworkBody: (walletChain, target) =>
      `Το πορτοφόλι σας είναι ${walletChain ? `στο δίκτυο ${walletChain}` : "σε άλλο δίκτυο"}. Αλλάξτε ${target ? `στο δίκτυο ${target}` : "στο δίκτυο πληρωμής"} για να πληρώσετε.`,
    switchTo: target => (target ? `Αλλαγή στο δίκτυο ${target}` : "Αλλαγή στο δίκτυο πληρωμής"),
    switching: "Αλλαγή δικτύου",
    loadingDetails: "Φόρτωση στοιχείων πληρωμής",
    price: "Τιμή",
    access: "Πρόσβαση",
    network: "Δίκτυο",
    networkFee: "Τέλος δικτύου",
    networkFeeValue: symbol => `Πληρώνεται σε ${symbol} για κάθε βήμα, εμφανίζεται στο πορτοφόλι σας`,
    period: (days, about) => (about ? `Περίπου ${elDays(days)}` : elDays(days)),
    pay: amount => `Πληρωμή ${amount}`,
    extend: (days, amount) => `Προσθήκη ${elDays(days)} για ${amount}`,
    extendHint: days =>
      `Κάθε πληρωμή προσθέτει ${elDays(days)} μετά την τρέχουσα ημερομηνία λήξης σας. Πληρώστε όσες φορές θέλετε· τίποτα δεν ανανεώνεται από μόνο του.`,
    accessExtended: date => `Η πρόσβαση παρατάθηκε έως τις ${date}.`,
    accessActive: "Η πρόσβαση είναι ενεργή. Μπορείτε τώρα να ρυθμίσετε τις ειδοποιήσεις.",
    paymentPending: "Η πληρωμή επιβεβαιώθηκε. Η πρόσβαση θα εμφανιστεί σύντομα.",
    loading: {
      processing: "Επεξεργασία",
      waitingForWallet: "Αναμονή για το πορτοφόλι σας",
      approving: "Έγκριση",
      paying: "Πληρωμή",
    },
    unavailable: "Η πρόσβαση επί πληρωμή δεν είναι διαθέσιμη αυτή τη στιγμή.",
    checkFailed: "Δεν ήταν δυνατός ο έλεγχος της κατάστασης πληρωμής. Δοκιμάστε ξανά σε λίγο.",
    approvalNotVisible: "Η έγκριση επιβεβαιώθηκε, αλλά δεν είναι ακόμη ορατή. Δοκιμάστε ξανά σε λίγο.",
  },
  payment: {
    stepsLabel: "Βήματα πληρωμής",
    approveTitle: amount => `Έγκριση ${amount}`,
    approveHint:
      "Επιτρέπει στο συμβόλαιο πληρωμής να λάβει ακριβώς αυτό το ποσό. Παραλείπεται όταν το καλύπτει μια προηγούμενη έγκριση.",
    payTitle: amount => `Πληρωμή ${amount}`,
    payHint: "Στέλνει την πληρωμή και ξεκλειδώνει τις ειδοποιήσεις.",
    inProgress: "Σε εξέλιξη",
    done: "Ολοκληρώθηκε",
    notNeeded: "Δεν χρειάζεται",
    transaction: "Συναλλαγή ",
    viewOn: explorer => `Προβολή στο ${explorer}`,
    preparingTitle: "Προετοιμασία της πληρωμής",
    preparingBody: "Έλεγχος της τρέχουσας τιμής και της έγκρισής σας.",
    confirmTitle: "Επιβεβαιώστε στο πορτοφόλι σας",
    approveSignBody: amount => `Βήμα 1 από 2: έγκριση ${amount}. Τίποτα δεν αποστέλλεται μέχρι να επιβεβαιώσετε.`,
    processingOn: network => `Επεξεργασία ${network ? `στο δίκτυο ${network}` : "στο δίκτυο"}`,
    approvePendingBody:
      "Βήμα 1 από 2: η έγκριση υποβλήθηκε. Στη συνέχεια το πορτοφόλι σας θα σας ζητήσει να επιβεβαιώσετε την πληρωμή.",
    paySignBody: amount => `Βήμα 2 από 2: πληρωμή ${amount}. Τίποτα δεν αποστέλλεται μέχρι να επιβεβαιώσετε.`,
    payPendingBody:
      "Βήμα 2 από 2: η πληρωμή υποβλήθηκε. Οι ειδοποιήσεις ξεκλειδώνονται μόλις το δίκτυο την επιβεβαιώσει.",
  },
};
