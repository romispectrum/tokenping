import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

// The calculator reads and shows numbers the app's way (a decimal point, "$2,400.00"), so the examples and hints
// keep the decimal point and group thousands with a space, which reads the same either way.
export const MESSAGES: CalculatorMessages = {
  title: "Υπολογιστής τιμής ρευστοποίησης Aave",
  intro:
    "Εισαγάγετε κάθε στοιχείο εξασφάλισης και το χρέος σας για να δείτε το health factor (δείκτης υγείας) και τις τιμές στις οποίες η θέση μπορεί να ρευστοποιηθεί. Χρησιμοποιεί τον τύπο του Aave V3: Σ(αξία εξασφάλισης × όριο ρευστοποίησης) ÷ αξία χρέους.",
  examplesLabel: "Φορτώστε ένα λυμένο παράδειγμα:",
  examples: {
    "one-collateral": "10 WETH, χρέος 12 000 USDC",
    "two-collaterals": "10 WETH + 0.2 WBTC, χρέος 20 000 USDC",
    "volatile-debt": "10 000 USDC, δανεισμένα 2.5 WETH",
  },
  defaultCollateralName: index => `Εξασφάλιση ${index}`,
  defaultDebtName: "Δανεισμένο στοιχείο",
  collateralLegend: index => `Εξασφάλιση ${index}`,
  presetLabel: "Στοιχείο του Aave V3 (συμπληρώνει το όριο)",
  eModeHint: (collateral, borrowable) =>
    `Αυτό το όριο ισχύει για ${joinList("el", collateral)}· οι άλλες εξασφαλίσεις κρατούν το δικό τους. Σε αυτό το E-Mode μπορείτε να δανειστείτε μόνο ${joinList("el", borrowable)}.`,
  otherAsset: "Άλλο στοιχείο: εισαγάγετε μόνοι σας το όριο",
  presetGroup: (market, date) => `${market} (ανάγνωση ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode «ETH correlated» (π.χ. WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (εγγενές)",
  },
  nameLabel: "Όνομα στοιχείου",
  namePlaceholder: symbols => `π.χ. ${joinList("el", symbols, "disjunction")}`,
  amountSupplied: "Κατατεθειμένη ποσότητα",
  price: "Τιμή (USD)",
  priceHint: "Η τιμή του oracle (πηγή τιμής) του Aave, όπως φαίνεται στη σελίδα του στοιχείου στην εφαρμογή Aave.",
  threshold: "Όριο ρευστοποίησης (%)",
  thresholdHint: "Σε E-Mode, το όριο της κατηγορίας. Στο Aave V4, ο collateral factor.",
  removeCollateral: index => `Αφαίρεση εξασφάλισης ${index}`,
  addCollateral: "Προσθήκη δεύτερης εξασφάλισης",
  debtLegend: "Χρέος",
  debtKindLegend: "Τι δανειστήκατε;",
  debtKinds: { stable: "Ένα stablecoin (υπολογίζεται στα $1.00)", volatile: "Ένα ευμετάβλητο στοιχείο, όπως το WETH" },
  debtAmount: { stable: "Δανεισμένο ποσό (USD)", volatile: "Δανεισμένη ποσότητα (token)" },
  debtAmountHint: "Συμπεριλάβετε τους τόκους που έχουν συσσωρευτεί μέχρι τώρα.",
  debtPrice: "Τιμή του δανεισμένου στοιχείου (USD)",
  errors: {
    number: "Εισαγάγετε έναν αριθμό όπως 10 ή 0.25, με τελεία για τα δεκαδικά.",
    price: "Εισαγάγετε τιμή μεγαλύτερη από 0.",
    threshold: "Εισαγάγετε ποσοστό μεγαλύτερο από 0 και έως 100.",
    samePrice: (name, price) =>
      `Το ${name} έχει ήδη εισαχθεί παραπάνω με τιμή ${price}. Χρησιμοποιήστε την ίδια τιμή: ένα στοιχείο έχει μία τιμή.`,
  },
  eModeLead: "Κανένα αποτέλεσμα: το Aave δεν επιτρέπει αυτόν τον συνδυασμό.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("el", borrowable);
    const loanText = loan.kind === "stable" ? "δάνειο σε stablecoin" : `δανεισμένο ${loan.name}`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `Το E-Mode «${category}» της αγοράς ${market} επιτρέπει δανεισμό μόνο σε ${borrowableList}, οπότε ένας λογαριασμός με ${loanText} ` +
      `δεν μπορεί να χρησιμοποιήσει το όριο ${thresholdPercent}%. Επιλέξτε αντί γι' αυτό το δικό όριο της εξασφάλισης${own} ή δανειστείτε ${borrowableList}.`
    );
  },
  results: {
    heading: "Αποτέλεσμα",
    empty: "Εισαγάγετε έναν αριθμό σε κάθε πεδίο για να δείτε το αποτέλεσμα.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Health factor",
    noDebt: "Δεν υπάρχει χρέος, οπότε δεν υπάρχει τίποτα για ρευστοποίηση.",
    liquidatableNow: "Κάτω από 1.00: η θέση μπορεί να ρευστοποιηθεί ήδη τώρα.",
    liquidatableBelow: "Η θέση μπορεί να ρευστοποιηθεί κάτω από 1.00.",
    none: "Καμία",
    priceTitle: name => `Τιμή ρευστοποίησης ${name}`,
    priceTitleBorrowed: name => `Τιμή ρευστοποίησης ${name} (δανεισμένο)`,
    priceTitleShared: name => `Τιμή ρευστοποίησης ${name} (κατατεθειμένο και δανεισμένο)`,
    recover: ({ name, change, now, rises, alike }) =>
      `Το health factor επιστρέφει στο 1.00 αν το ${name}${alike ? " (κατατεθειμένο και δανεισμένο)" : ""} ${
        rises ? "ανέβει" : "πέσει"
      } κατά ${change} από ${now}, με τις άλλες τιμές αμετάβλητες.`,
    collateralFall: ({ change, now }) => `${change} κάτω από ${now}, αν όλες οι άλλες τιμές μείνουν ίδιες.`,
    collateralNone: name =>
      `Ακόμη και στα $0, το ${name} μόνο του δεν μπορεί να ρίξει το health factor κάτω από 1.00: οι άλλες εξασφαλίσεις καλύπτουν το χρέος.`,
    debtRise: ({ change, now }) =>
      `${change} πάνω από ${now}: τα δανεισμένα στοιχεία ρίχνουν το health factor όταν η τιμή τους ανεβαίνει.`,
    sharedRise: ({ name, change, now }) =>
      `${change} πάνω από ${now}: δανειστήκατε περισσότερο ${name} από όσο μετράει η εξασφάλισή σας σε ${name}, οπότε μια άνοδος ρίχνει το health factor. Οι άλλες τιμές αμετάβλητες.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `${change} κάτω από ${now}, με το δανεισμένο ${name} στην ίδια τιμή και όλες τις άλλες τιμές αμετάβλητες.`,
    sharedFallRows: ({ name, change, now }) =>
      `${change} κάτω από ${now} για κάθε γραμμή ${name}, αν όλες οι άλλες τιμές μείνουν ίδιες.`,
    bothSidesNeutral: name =>
      `Το ${name} είναι και εξασφάλιση και χρέος σας, οπότε τα δύο κινούνται μαζί και η τιμή του δεν αλλάζει το health factor. Οι τόκοι, μια αλλαγή του ορίου ή οι δικές σας συναλλαγές εξακολουθούν να το αλλάζουν.`,
    bothSidesRecover: name =>
      `Το ${name} βρίσκεται και στις δύο πλευρές, οπότε τα δύο κινούνται μαζί: καμία τιμή του ${name} μόνη της δεν επαναφέρει το health factor στο 1.00.`,
    bothSidesSafe: name =>
      `Το ${name} βρίσκεται και στις δύο πλευρές, οπότε τα δύο κινούνται μαζί: η τιμή του μόνη της δεν μπορεί να ρίξει το health factor κάτω από 1.00.`,
    uniformTitle: "Όλες οι εξασφαλίσεις πέφτουν μαζί",
    uniformDescription: prices =>
      `Αν η τιμή κάθε εξασφάλισης πέσει τόσο και η τιμή του χρέους δεν κινηθεί, το health factor φτάνει στο 1.00: ${joinList(
        "el",
        prices.map(({ name, price }) => `${name} στα ${price}`),
      )}.`,
    ratioTitle: (numerator, denominator) => `Λόγος τιμών ${numerator} ÷ ${denominator} στη ρευστοποίηση`,
    ratioDescription: (now, change, falls) =>
      `Τώρα ${now}. Αν κινηθούν και οι δύο τιμές, ${falls ? "μια πτώση" : "μια άνοδος"} ${change} σε αυτόν τον λόγο φέρνει το health factor στο 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Εξασφάλιση ${collateral}, υπολογισμένη με τα όρια ρευστοποίησής της: ${weighted}. Health factor = ${weighted} ÷ ${debt} χρέους = ${healthFactor}.`,
  },
  noscript:
    "Ο υπολογιστής χρειάζεται JavaScript για να κάνει νέο υπολογισμό. Το παραπάνω αποτέλεσμα αφορά 10 WETH στα $2 400 (όριο ρευστοποίησης 83%) έναντι χρέους 12 000 USDC· τα λυμένα παραδείγματα αυτής της σελίδας χρησιμοποιούν τον ίδιο τύπο.",
  disclaimer: {
    lead: "Εκπαιδευτική εκτίμηση, όχι χρηματοοικονομική συμβουλή.",
    beforeDate:
      "Χρησιμοποιεί μόνο τους αριθμούς που εισάγετε. Οι τρέχουσες παράμετροι του Aave μπορεί να αλλάξουν: τα παραπάνω όρια διαβάστηκαν από το blockchain στις",
    afterDate:
      ", και η διακυβέρνηση ή οι Risk Stewards μπορούν να τα αλλάξουν οποιαδήποτε στιγμή. Οι τιμές των oracle κινούνται, οι τόκοι συνεχίζουν να προστίθενται στο χρέος σας και κάθε τιμή ρευστοποίησης προϋποθέτει ότι όλες οι άλλες τιμές μένουν ίδιες. Ελέγξτε τη θέση σας στην εφαρμογή Aave πριν ενεργήσετε.",
  },
};
