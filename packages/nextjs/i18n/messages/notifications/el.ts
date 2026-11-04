import type { NotificationMessages } from "./shared";
import { elOnMarket, plural } from "~~/i18n/format";

const maturityWindow = (stage: "7d" | "1d") => (stage === "7d" ? "7 ημέρες" : "24 ώρες");

export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `Το health factor σας στο Aave ${elOnMarket(chainName)} είναι ${healthFactor}, ` +
    `κάτω από το όριό σας (${threshold}). ` +
    `Εξετάστε το ενδεχόμενο να προσθέσετε εξασφάλιση ή να αποπληρώσετε χρέος για να αποφύγετε τη ρευστοποίηση.\n\nΣτάλθηκε: ${timestamp}`,
  alertSubject: chainName => `Ειδοποίηση health factor Aave - ${chainName}`,
  // The html footer says "Δημιουργήθηκε" where the text says "Στάλθηκε", as the English does.
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>Το health factor σας στο Aave ${elOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} είναι ` +
    `<strong>${healthFactor}</strong>, κάτω από το όριό σας ` +
    `(<strong>${threshold}</strong>).</p>` +
    `<p>Εξετάστε το ενδεχόμενο να προσθέσετε εξασφάλιση ή να αποπληρώσετε χρέος για να αποφύγετε τη ρευστοποίηση.</p>` +
    `<p><small>Δημιουργήθηκε: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "κρίσιμο", risky: "επικίνδυνο", safe: "ασφαλές" };
    const now =
      position.kind === "debt"
        ? `Αυτή τη στιγμή: health factor ${position.healthFactor} (${statusWord[position.status]}), εξασφάλιση ${position.collateral}, χρέος ${position.debt}.`
        : position.kind === "noDebt"
          ? `Αυτή τη στιγμή: δεν υπάρχει χρέος, οπότε τίποτα δεν μπορεί να ρευστοποιηθεί${position.collateral ? ` (εξασφάλιση ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Αυτή τη στιγμή: δεν υπάρχει ανοιχτή θέση σε αυτή την αγορά."
            : "Αυτή τη στιγμή: δεν ήταν δυνατή η ανάγνωση της θέσης σας. Οι πραγματικές ειδοποιήσεις δοκιμάζουν ξανά σε κάθε έλεγχο.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "Αυτό είναι κάτω από το όριό σας, οπότε ο επόμενος έλεγχος θα στείλει πραγματική ειδοποίηση."
          : "Αυτό είναι πάνω από το όριό σας, οπότε δεν θα στελνόταν ειδοποίηση τώρα."
        : null;
    const every = plural("el", minutes, { one: "κάθε λεπτό", other: `κάθε ${minutes} λεπτά` });
    return [
      "Δοκιμαστικό μήνυμα από το Tokenping: οι ειδοποιήσεις σε αυτό το κανάλι λειτουργούν.",
      `Η ειδοποίησή σας: ${chainName}, όταν το health factor πέσει κάτω από ${threshold}.`,
      now,
      ...(verdict ? [verdict] : []),
      `Έλεγχος ${every}. Στάλθηκε: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Δοκιμαστικό μήνυμα Tokenping - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (LLTV ${market.lltv})`
      : `${market.loan} σταθερού επιτοκίου, λήξη ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Το health factor σας στο Morpho ${elOnMarket(chainName, "network")} είναι ${healthFactor}, κάτω από το όριό σας (${threshold}).`,
    `Αγορά: ${market}.`,
    ...(preLiquidation
      ? [
          "Έχετε ενεργοποιήσει την προ-ρευστοποίηση (pre-liquidation) σε αυτή την αγορά, οπότε το health factor μετριέται με βάση το νωρίτερο όριό της: κάτω από 1, μέρος της θέσης σας μπορεί να πωληθεί.",
        ]
      : []),
    "Εξετάστε το ενδεχόμενο να προσθέσετε εξασφάλιση ή να αποπληρώσετε χρέος για να αποφύγετε τη ρευστοποίηση.",
    `Στάλθηκε: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Ειδοποίηση health factor Morpho - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Το δάνειο σταθερού επιτοκίου σας στο Morpho ${elOnMarket(chainName, "network")} έληξε στις ${when} και έχει ακόμη χρέος ${debt}.`,
          `Αγορά: ${market}.`,
          "Μπορεί πλέον να ρευστοποιηθεί οποιαδήποτε στιγμή, ανεξάρτητα από το health factor. Αποπληρώστε το για να αποφύγετε τη ρευστοποίηση.",
          `Στάλθηκε: ${timestamp}`,
        ]
      : [
          `Το δάνειο σταθερού επιτοκίου σας στο Morpho ${elOnMarket(chainName, "network")} λήγει μέσα σε ${maturityWindow(stage)}, στις ${when}.`,
          `Αγορά: ${market}.`,
          `Χρέος: ${debt}.`,
          "Μετά τη λήξη, όποιο χρέος μείνει απλήρωτο μπορεί να ρευστοποιηθεί, οπότε αποπληρώστε το πριν από τότε.",
          `Στάλθηκε: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Δάνειο Morpho μετά τη λήξη - ${chainName}`
      : `Δάνειο Morpho που λήγει μέσα σε ${maturityWindow(stage)} - ${chainName}`,
};
