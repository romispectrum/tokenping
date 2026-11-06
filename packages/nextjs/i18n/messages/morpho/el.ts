import type { MorphoMessages } from "./shared";
import { elForMarket, elOnMarket, plural } from "~~/i18n/format";

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Ειδοποιήσεις health factor για Morpho Blue και Midnight",
    metaDescription: (networkCount, channels) =>
      `Ειδοποιήσεις health factor για Morpho Blue και Midnight μέσω ${channels}, ${plural("el", networkCount, { one: `σε ${networkCount} δίκτυο`, other: `σε ${networkCount} δίκτυα` })}, με υπενθυμίσεις πριν λήξει δάνειο σταθερού επιτοκίου.`,
    title: "Θέσεις Morpho Blue και Midnight και ειδοποιήσεις health factor",
    intro: networks =>
      `Οι θέσεις δανεισμού σας στις αγορές που εμφανίζει η εφαρμογή του Morpho, στα δίκτυα ${networks}: δάνεια κυμαινόμενου επιτοκίου (Morpho Blue) και δάνεια σταθερού επιτοκίου (Morpho Midnight). Τα health factor διαβάζονται από το blockchain.`,
    checks: (minutes, repeatMinutes) =>
      `Οι ειδοποιήσεις ελέγχονται ${plural("el", minutes, { one: "κάθε λεπτό", other: `κάθε ${minutes} λεπτά` })}. Ένα δάνειο σταθερού επιτοκίου λαμβάνει επίσης υπενθύμιση 7 ημέρες και 1 ημέρα πριν από τη λήξη του, καθώς και ειδοποίηση κάθε ${repeatMinutes} λεπτά μετά τη λήξη όσο υπάρχει ακόμη χρέος.`,
    access: "Μία πληρωμή πρόσβασης καλύπτει τις ειδοποιήσεις σας για το Aave και το Morpho.",
    notAffiliated: "Το Tokenping δεν συνδέεται με το Morpho.",
    guideHealthFactor: "Πώς λειτουργεί το health factor στο Morpho",
    guideLiquidation: "Πώς λειτουργεί η ρευστοποίηση στο Morpho",
    guideMidnight: "Δάνεια σταθερού επιτοκίου στο Morpho Midnight",
    aaveDashboard: "Δανείζεστε στο Aave; Ανοίξτε τον πίνακα ελέγχου Aave",
  },
  positionsHeading: "Οι θέσεις σας στο Morpho",
  gate: {
    title: "Συνδέστε πορτοφόλι για να συνεχίσετε",
    description:
      "Το Tokenping χρειάζεται τη διεύθυνση του πορτοφολιού σας για να βρει τις θέσεις σας στο Morpho. Η σύνδεση δεν μετακινεί κεφάλαια και δεν χρεώνει κανένα τέλος.",
    connect: "Συνδέστε πορτοφόλι",
    connecting: "Σύνδεση",
    approveInWallet: "Εγκρίνετε τη σύνδεση στο πορτοφόλι σας.",
  },
  list: {
    heading: "Αγορές",
    count: count => `${count} με χρέος`,
    none: "Δεν βρέθηκε δανεισμός στις αγορές που εμφανίζει η εφαρμογή του Morpho.",
    discoveryFailed: "Το API του Morpho δεν απάντησε, οπότε εμφανίζονται μόνο οι αγορές με αποθηκευμένη ειδοποίηση.",
    variableRate: "Κυμαινόμενο επιτόκιο",
    fixedRate: "Σταθερό επιτόκιο",
    matures: date => `Λήξη ${date}`,
    matured: "Μετά τη λήξη",
    unreadable: "Δεν ήταν δυνατή η ανάγνωση",
    retry: market => `Νέα ανάγνωση της αγοράς ${market}`,
    noneSelectedDescription: "Επιλέξτε μια αγορά για να δείτε τη θέση σας στο Morpho.",
  },
  details: {
    collateralValue: "Αξία εξασφάλισης",
    debt: "Χρέος",
    ltv: "LTV",
    lltv: "LTV ρευστοποίησης",
    maturity: "Λήξη",
    timeLeft: (days, hours) =>
      days > 0
        ? plural("el", days, { one: "σε 1 ημέρα", other: `σε ${days} ημέρες` })
        : plural("el", hours, { one: "σε 1 ώρα", other: `σε ${hours} ώρες` }),
    pastMaturity:
      "Αυτό το δάνειο έχει περάσει τη λήξη του: όποιο χρέος απομένει μπορεί να ρευστοποιηθεί οποιαδήποτε στιγμή, ανεξάρτητα από το health factor. Αποπληρώστε το για να αποφύγετε τη ρευστοποίηση.",
    preLiquidation: "Προ-ρευστοποίηση",
    preLiquidationNote:
      "Έχετε ενεργοποιήσει την προ-ρευστοποίηση (pre-liquidation) σε αυτή την αγορά, οπότε το health factor μετριέται με βάση το νωρίτερο όριό της: κάτω από 1, μέρος της θέσης σας μπορεί να πωληθεί.",
    amountsIn: token => `Τα ποσά είναι σε ${token}, με αποτίμηση από το oracle της αγοράς.`,
    noDebtTitle: "Δεν υπάρχει χρέος σε αυτή την αγορά",
    noDebtDetail: "Μια αποθηκευμένη ειδοποίηση παραμένει αποθηκευμένη και δεν στέλνει τίποτα όσο δεν υπάρχει χρέος.",
    unreadableTitle: "Δεν ήταν δυνατή η ανάγνωση αυτής της θέσης",
    unreadableDetail: "Το δίκτυο δεν απάντησε. Η ειδοποίησή σας συνεχίζει να ελέγχεται.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Πληρώστε μία φορά για να ορίσετε ειδοποιήσεις health factor ${elOnMarket(marketName, "market")} και σε άλλες αγορές. Τίποτα δεν ανανεώνεται αυτόματα: πληρώνετε από το πορτοφόλι σας όταν θέλετε να παρατείνετε.`,
    descriptionExtend: marketName =>
      `Οι αποθηκευμένες ρυθμίσεις ειδοποίησης ${elForMarket(marketName, "market")} βρίσκονται ακόμη στον λογαριασμό σας. Πληρώστε ξανά για να παρατείνετε την πρόσβαση και να τις επεξεργαστείτε.`,
  },
};
