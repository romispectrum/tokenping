import type { AlertsMessages } from "./shared";
import { elForMarket, elOnMarket, plural } from "~~/i18n/format";

const ATTRIBUTION_QUESTION = "Πώς μάθατε για το Tokenping;";

export const MESSAGES: AlertsMessages = {
  cardTitle: "Ρυθμίσεις ειδοποιήσεων",
  active: "Ενεργή",
  payToEdit: "Πληρώστε για πρόσβαση και επεξεργασία",
  editAlert: "Επεξεργασία ειδοποίησης",
  signInTitle: "Συνδεθείτε για να διαχειριστείτε τις ειδοποιήσεις σας",
  signInDescription:
    "Το πορτοφόλι σας υπογράφει ένα μήνυμα που αποδεικνύει ότι η διεύθυνση είναι δική σας. Δεν είναι συναλλαγή και δεν κοστίζει gas.",
  signIn: "Σύνδεση με πορτοφόλι",
  signingIn: "Αναμονή για το πορτοφόλι σας",
  signInStatement: "Συνδεθείτε στο Tokenping για να δείτε και να επεξεργαστείτε τις ειδοποιήσεις health factor σας.",
  signInRejected: "Απορρίψατε το αίτημα υπογραφής. Συνδεθείτε για να δείτε και να επεξεργαστείτε τις ειδοποιήσεις σας.",
  signInFailed: "Η σύνδεση απέτυχε. Δοκιμάστε ξανά.",
  signInExpired: "Η σύνδεσή σας έληξε. Συνδεθείτε ξανά με το πορτοφόλι σας.",
  emptyTitle: (chainName, kind) => `Δεν υπάρχουν ακόμη ειδοποιήσεις ${elOnMarket(chainName, kind)}`,
  emptyDescription: "Λάβετε μήνυμα όταν το health factor σας πέσει κάτω από ένα όριο που επιλέγετε.",
  createAlert: "Δημιουργία ειδοποίησης",
  loadErrorTitle: "Οι ρυθμίσεις ειδοποιήσεων δεν φορτώθηκαν",
  loadErrorDescription: "Ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.",
  tryAgain: "Δοκιμάστε ξανά",
  retrying: "Νέα προσπάθεια",
  servicesLegend: "Κανάλια ειδοποιήσεων",
  servicesDescription: "Επιλέξτε πού θα πηγαίνουν οι ειδοποιήσεις. Μπορείτε να επιλέξετε περισσότερα από ένα.",
  serviceNames: { email: "Email", signal: "Signal", telegram: "Telegram" },
  emailLabel: "Διεύθυνση email",
  emailDescription: "Οι ειδοποιήσεις αποστέλλονται σε αυτή τη διεύθυνση.",
  emailPlaceholder: "you@example.com",
  signalLabel: "Όνομα χρήστη Signal",
  signalDescription: "Στο Signal, ανοίξτε τις Ρυθμίσεις και μετά το Προφίλ. Μοιάζει με alice.42.",
  telegramLabel: "Όνομα χρήστη Telegram",
  telegramDescription:
    "Οι ειδοποιήσεις πηγαίνουν σε αυτόν τον λογαριασμό Telegram. Θα το βρείτε στο Telegram, στις Ρυθμίσεις, μετά Όνομα χρήστη.",
  telegramPlaceholder: "alice_eth",
  telegramChecking: "Έλεγχος",
  telegramLinked: username =>
    `Το @${username} είναι συνδεδεμένο: οι ειδοποιήσεις θα έρχονται στη συνομιλία σας στο Telegram.`,
  telegramPressStart: bot =>
    `Δεν έχει συνδεθεί ακόμη: πατήστε μία φορά Start στο ${bot ? `@${bot}` : "bot του Tokenping"}.`,
  openBot: bot => `Άνοιγμα του @${bot}`,
  telegramStatusUnknown:
    "Δεν ήταν δυνατό να ελεγχθεί αν αυτό το όνομα χρήστη είναι συνδεδεμένο. Μπορείτε παρ' όλα αυτά να αποθηκεύσετε.",
  opensInNewTab: "(ανοίγει σε νέα καρτέλα)",
  channelLanguageLabels: { email: "Γλώσσα email", signal: "Γλώσσα Signal", telegram: "Γλώσσα Telegram" },
  thresholdLabel: "Όριο health factor",
  thresholdExactValue: "(ακριβής τιμή)",
  thresholdScale: { critical: "Κρίσιμο", safe: "Ασφαλές", verySafe: "Πολύ ασφαλές" },
  thresholdDescription: (threshold, chainName, kind) =>
    `Θα λάβετε ειδοποίηση όταν το health factor σας ${elOnMarket(chainName, kind)} πέσει κάτω από ${threshold}.`,
  saveAlert: "Αποθήκευση ειδοποίησης",
  saving: "Αποθήκευση",
  cancel: "Ακύρωση",
  deleteAlert: "Διαγραφή ειδοποίησης",
  deleting: "Διαγραφή",
  keepAlert: "Διατήρηση ειδοποίησης",
  deleteTitle: "Διαγραφή αυτής της ειδοποίησης;",
  deleteDescription: (chainName, kind) =>
    `Το Tokenping θα σταματήσει να στέλνει ειδοποιήσεις health factor ${elForMarket(chainName, kind)}.`,
  errorSummaryTitle: count =>
    plural("el", count, {
      one: `Διορθώστε ${count} πεδίο για να αποθηκεύσετε`,
      other: `Διορθώστε ${count} πεδία για να αποθηκεύσετε`,
    }),
  formErrors: {
    noService: "Επιλέξτε τουλάχιστον ένα κανάλι ειδοποιήσεων.",
    noEmail: "Εισαγάγετε τη διεύθυνση email σας.",
    invalidEmail: "Εισαγάγετε μια διεύθυνση email όπως name@example.com.",
    noSignal: "Εισαγάγετε το όνομα χρήστη σας στο Signal.",
    invalidSignal:
      "Εισαγάγετε ένα όνομα χρήστη Signal όπως alice.42. Θα βρείτε το δικό σας στο Signal, στις Ρυθμίσεις, μετά Προφίλ.",
    noTelegram: "Εισαγάγετε το όνομα χρήστη σας στο Telegram.",
    invalidTelegram:
      "Εισαγάγετε ένα όνομα χρήστη Telegram όπως alice_eth: 4 έως 32 λατινικά γράμματα, ψηφία ή κάτω παύλες, που ξεκινά με γράμμα και δεν τελειώνει σε _.",
  },
  summaryServices: "Κανάλια",
  summaryNoServices: "Κανένα επιλεγμένο",
  summaryEmail: "Email",
  summarySignal: "Signal",
  summaryTelegram: "Telegram",
  summaryLanguage: "Γλώσσα",
  summaryTelegramNotLinked: bot => `Δεν έχει συνδεθεί ακόμη: πατήστε μία φορά Start στο @${bot}.`,
  summaryThreshold: "Όριο",
  sendTest: "Αποστολή δοκιμής",
  sendingTest: "Αποστολή",
  testAgainIn: minutes => `Ξανά σε ${minutes} λεπ.`,
  testSent: channel =>
    `Το δοκιμαστικό μήνυμα στάλθηκε μέσω ${channel === "Email" ? "email" : channel}. Ελέγξτε ότι έφτασε.`,
  testFailed: "Το δοκιμαστικό μήνυμα δεν στάλθηκε",
  testLimitNote: minutes =>
    `Μια δοκιμή στέλνει αυτή την ειδοποίηση και τη θέση σας όπως είναι τώρα. Μία ανά κανάλι ${plural("el", minutes, { one: "κάθε λεπτό", other: `κάθε ${minutes} λεπτά` })}.`,
  belowThresholdTitle: "Κάτω από το όριο ειδοποίησής σας",
  belowThresholdDescription: (healthFactor, threshold) =>
    `Το τρέχον health factor σας (${healthFactor}) είναι κάτω από το όριό σας (${threshold}).`,
  alertSaved: "Η ειδοποίηση αποθηκεύτηκε",
  saveFailed: "Δεν ήταν δυνατή η αποθήκευση της ειδοποίησής σας",
  alertDeleted: "Η ειδοποίηση διαγράφηκε",
  deleteFailed: "Δεν ήταν δυνατή η διαγραφή της ειδοποίησής σας",
  attributionQuestion: ATTRIBUTION_QUESTION,
  attributionFormLabel: `${ATTRIBUTION_QUESTION} (προαιρετικό)`,
  attributionDescription:
    "Μας βοηθά να καταλάβουμε ποια κανάλια λειτουργούν. Αποθηκεύεται μαζί με τη διεύθυνση του πορτοφολιού σας.",
  attributionEmpty: "Γράψτε μια απάντηση ή επιλέξτε Παράλειψη.",
  // The checks behind it (length, hidden control characters) only fail for pasted text.
  attributionInvalid: () =>
    "Η απάντηση είναι πολύ μεγάλη ή περιέχει κρυφούς χαρακτήρες. Γράψτε την ξανά και δοκιμάστε πάλι.",
  attributionSendFailed: "Δεν ήταν δυνατή η αποστολή της απάντησής σας. Δοκιμάστε ξανά ή παραλείψτε.",
  sendAnswer: "Αποστολή απάντησης",
  sending: "Αποστολή",
  skip: "Παράλειψη",
  answerSent: "Η απάντηση στάλθηκε",
};
