import type { BlogMessages } from "./shared";
import { formatDecimal, plural } from "~~/i18n/format";

/** "κάθε 5 λεπτά", "κάθε λεπτό". */
const elEveryMinutes = (minutes: number) =>
  plural("el", minutes, { one: "κάθε λεπτό", other: `κάθε ${minutes} λεπτά` });

/** "σε 22 δίκτυα", "σε 1 δίκτυο". */
const elOnNetworks = (networks: number) =>
  plural("el", networks, { one: `σε ${networks} δίκτυο`, other: `σε ${networks} δίκτυα` });

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Αρχική", blog: "Ιστολόγιο" },
  index: {
    title: "Οδηγοί Aave και Morpho: health factor και ρευστοποίηση",
    description:
      "Οδηγοί για το health factor στο Aave και στο Morpho, τις ρευστοποιήσεις, την τιμή ρευστοποίησης και τις ειδοποιήσεις, με παραδείγματα και στοιχεία με πηγή.",
    kicker: "Οδηγοί για Aave και Morpho",
    lead: "Πώς λειτουργεί το health factor (δείκτης υγείας) στο Aave και στο Morpho, τι συμβαίνει σε μια ρευστοποίηση, πώς υπολογίζετε την τιμή ρευστοποίησής σας και πώς ενημερώνεστε πριν πλησιάσει. Κάθε στοιχείο σε αυτούς τους οδηγούς αναφέρει την πηγή του και την ημερομηνία που ελέγχθηκε.",
    dashboardCta: "Άνοιγμα του πίνακα ελέγχου Aave",
    morphoDashboardCta: "Άνοιγμα του πίνακα ελέγχου Morpho",
    rss: "Εγγραφή μέσω RSS",
    startHere: "Ξεκινήστε από εδώ",
    allGuides: "Όλοι οι οδηγοί",
    empty: {
      title: "Δεν υπάρχουν ακόμη οδηγοί",
      description: "Οι πρώτοι οδηγοί γράφονται τώρα. Εγγραφείτε μέσω RSS για να τους λαμβάνετε μόλις δημοσιευτούν.",
      otherLanguage: "Διαβάστε τους οδηγούς στα αγγλικά",
    },
  },
  post: {
    kicker: "Οδηγός για το Aave V3",
    morphoKicker: "Οδηγός για το Morpho",
    byline: { author: "Από την ομάδα του Tokenping", published: "Δημοσίευση", updated: "Ενημέρωση" },
    readingTime: minutes =>
      plural("el", minutes, { one: `${minutes} λεπτό ανάγνωσης`, other: `${minutes} λεπτά ανάγνωσης` }),
    readGuide: "Διαβάστε τον οδηγό",
    related: "Σχετικοί οδηγοί",
  },
  endBox: {
    label: "Σχετικά με το Tokenping",
    title: "Ειδοποιήσεις health factor από το Tokenping",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Το Tokenping ελέγχει το health factor σας στο Aave V3 και V4 ${elEveryMinutes(minutes)} ${elOnNetworks(networks)} και σας στέλνει μήνυμα μέσω ${channels} όταν πέσει κάτω από το όριό σας. Οι ειδοποιήσεις κοστίζουν ${price}${paymentChain ? `, με πληρωμή στο δίκτυο ${paymentChain}` : ""}· για να δείτε τις θέσεις σας δεν πληρώνετε τίποτα. Οι ειδοποιήσεις σας δίνουν χρόνο να ενεργήσετε, αλλά δεν αποτρέπουν τη ρευστοποίηση.`,
    cta: "Άνοιγμα του πίνακα ελέγχου",
    morpho: {
      title: "Ειδοποιήσεις health factor για το Morpho από το Tokenping",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Το Tokenping ελέγχει το health factor σας στο Morpho Blue και στο Midnight ${elEveryMinutes(minutes)} ${elOnNetworks(networks)} και σας στέλνει μήνυμα μέσω ${channels} όταν πέσει κάτω από το όριό σας, με υπενθυμίσεις πριν από τη λήξη ενός δανείου σταθερού επιτοκίου. Οι ειδοποιήσεις κοστίζουν ${price}${paymentChain ? `, με πληρωμή στο δίκτυο ${paymentChain}` : ""}, το ίδιο πρόγραμμα με τις ειδοποιήσεις για το Aave· για να δείτε τις θέσεις σας δεν πληρώνετε τίποτα. Οι ειδοποιήσεις σας δίνουν χρόνο να ενεργήσετε, αλλά δεν αποτρέπουν τη ρευστοποίηση.`,
      cta: "Άνοιγμα του πίνακα ελέγχου Morpho",
    },
  },
  alertPrice: {
    fallback: "μια μικρή χρέωση σε USDC (η τρέχουσα τιμή φαίνεται στον πίνακα ελέγχου)",
    plan: ({ priceLabel, days }) =>
      `${formatDecimal("el", priceLabel)} ${plural("el", days, { one: "την ημέρα", other: `ανά ${days} ημέρες` })}`,
  },
  callout: { info: "Σημείωση", warning: "Προσοχή" },
  shortAnswer: "Σύντομη απάντηση",
  scopeNote: {
    text: "Ισχύει για το Aave V3.7, όπως ελέγχθηκε στις αγορές Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche και Gnosis. Άλλες αγορές και δίκτυα του V3 μπορεί να τρέχουν παλαιότερες εκδόσεις. Οι διαφορές του Aave V4 σημειώνονται όπου οι κανόνες διαφέρουν.",
    morphoText:
      "Ισχύει για τις αγορές Morpho Blue και Morpho Midnight που εμφανίζει η εφαρμογή του Morpho. Κάθε αγορά ορίζει τη δική της εξασφάλιση, το δικό της oracle (πηγή τιμής) και το δικό της LLTV, οπότε ελέγξτε τα στοιχεία της δικής σας.",
    figuresAsOf: "Τα στοιχεία ισχύουν στις",
  },
  table: {
    fallbackLabel: "Πίνακας, κύλιση οριζόντια",
    label: (heading, index) => (index === undefined ? `Πίνακας: ${heading}` : `Πίνακας ${index}: ${heading}`),
    scrollHint: "Κάντε κύλιση στο πλάι για να δείτε όλες τις στήλες.",
  },
};
