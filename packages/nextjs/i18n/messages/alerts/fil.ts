import type { AlertsMessages } from "./shared";
import { filForMarket, filOnMarket, plural } from "~~/i18n/format";

const ATTRIBUTION_QUESTION = "Paano mo nalaman ang Tokenping?";

// The channel's name comes from serviceNames, where email is the badge "Email"; inside a sentence it is "email".
const channelInSentence = (channel: string) => (channel === "Email" ? "email" : channel);

export const MESSAGES: AlertsMessages = {
  cardTitle: "Mga setting ng alerto",
  active: "Aktibo",
  payToEdit: "Magbayad para sa access para ma-edit",
  editAlert: "I-edit ang alerto",
  signInTitle: "Mag-sign in para pamahalaan ang mga alerto mo",
  signInDescription:
    "Pipirmahan ng wallet mo ang isang mensaheng nagpapatunay na sa iyo ang address. Hindi ito transaksyon at walang gas na gagastusin.",
  signIn: "Mag-sign in gamit ang wallet",
  signingIn: "Hinihintay ang wallet mo",
  signInStatement: "Mag-sign in sa Tokenping para makita at ma-edit ang mga health factor alert mo.",
  signInRejected: "Tinanggihan mo ang hiling na pumirma. Mag-sign in para makita at ma-edit ang mga alerto mo.",
  signInFailed: "Hindi ka ma-sign in. Subukan ulit.",
  signInExpired: "Natapos na ang sign-in mo. Mag-sign in ulit gamit ang wallet mo.",
  emptyTitle: (chainName, kind) => `Wala pang alerto ${filOnMarket(chainName, kind)}`,
  emptyDescription: "Makatanggap ng mensahe kapag bumaba ang health factor mo sa threshold na pipiliin mo.",
  createAlert: "Gumawa ng alerto",
  loadErrorTitle: "Hindi na-load ang mga setting ng alerto",
  loadErrorDescription: "Tingnan ang koneksyon mo at subukan ulit.",
  tryAgain: "Subukan ulit",
  retrying: "Sinusubukan ulit",
  servicesLegend: "Mga channel ng alerto",
  servicesDescription: "Piliin kung saan ipapadala ang mga alerto. Puwede kang pumili ng higit sa isa.",
  serviceNames: { email: "Email", signal: "Signal", telegram: "Telegram" },
  emailLabel: "Email address",
  emailDescription: "Sa address na ito ipapadala ang mga alerto.",
  emailPlaceholder: "ikaw@example.com",
  signalLabel: "Signal username",
  signalDescription: "Sa Signal, buksan ang Settings, tapos Profile. Ganito ang itsura: alice.42.",
  telegramLabel: "Telegram username",
  telegramDescription:
    "Sa Telegram account na ito ipapadala ang mga alerto. Makikita ito sa Telegram sa Settings, tapos Username.",
  telegramPlaceholder: "alice_eth",
  telegramChecking: "Tinitingnan",
  telegramLinked: username => `Naka-link na ang @${username}: darating ang mga alerto sa Telegram chat mo.`,
  telegramPressStart: bot =>
    `Hindi pa naka-link: pindutin nang isang beses ang Start sa ${bot ? `@${bot}` : "Tokenping bot"}.`,
  openBot: bot => `Buksan ang @${bot}`,
  telegramStatusUnknown: "Hindi matingnan kung naka-link ang username na ito. Puwede mo pa rin itong i-save.",
  opensInNewTab: "(bubukas sa bagong tab)",
  channelLanguageLabels: { email: "Wika ng email", signal: "Wika ng Signal", telegram: "Wika ng Telegram" },
  thresholdLabel: "Health factor threshold",
  thresholdExactValue: "(eksaktong value)",
  thresholdScale: { critical: "Kritikal", safe: "Ligtas", verySafe: "Napakaligtas" },
  thresholdDescription: (threshold, chainName, kind) =>
    `Aabisuhan ka kapag bumaba ang health factor mo ${filOnMarket(chainName, kind)} sa ilalim ng ${threshold}.`,
  saveAlert: "I-save ang alerto",
  saving: "Sine-save",
  cancel: "Kanselahin",
  deleteAlert: "I-delete ang alerto",
  deleting: "Dine-delete",
  keepAlert: "Panatilihin ang alerto",
  deleteTitle: "I-delete ang alertong ito?",
  deleteDescription: (chainName, kind) =>
    `Titigil ang Tokenping sa pagpapadala ng mga health factor alert ${filForMarket(chainName, kind)}.`,
  // Filipino nouns do not change after a number: both forms read the same.
  errorSummaryTitle: count =>
    plural("fil", count, {
      one: `Ayusin ang ${count} field para ma-save`,
      other: `Ayusin ang ${count} field para ma-save`,
    }),
  formErrors: {
    noService: "Pumili ng kahit isang channel ng alerto.",
    noEmail: "Ilagay ang email address mo.",
    invalidEmail: "Maglagay ng email address na tulad ng pangalan@example.com.",
    noSignal: "Ilagay ang Signal username mo.",
    invalidSignal:
      "Maglagay ng Signal username na tulad ng alice.42. Makikita mo ang sa iyo sa Signal sa Settings, tapos Profile.",
    noTelegram: "Ilagay ang Telegram username mo.",
    invalidTelegram:
      "Maglagay ng Telegram username na tulad ng alice_eth: 4 hanggang 32 letra, numero o underscore, nagsisimula sa letra at hindi nagtatapos sa _.",
  },
  summaryServices: "Mga channel",
  summaryNoServices: "Walang napili",
  summaryEmail: "Email",
  summarySignal: "Signal",
  summaryTelegram: "Telegram",
  summaryLanguage: "Wika",
  summaryTelegramNotLinked: bot => `Hindi pa naka-link: pindutin nang isang beses ang Start sa @${bot}.`,
  summaryThreshold: "Threshold",
  sendTest: "Magpadala ng test",
  sendingTest: "Ipinapadala",
  testAgainIn: minutes => `Ulit sa loob ng ${minutes} min`,
  testSent: channel => `Naipadala ang test na mensahe sa ${channelInSentence(channel)}. Tingnan kung dumating ito.`,
  testFailed: "Hindi naipadala ang test na mensahe",
  testLimitNote: minutes =>
    `Ipinapadala ng test ang alertong ito at ang posisyon mo sa kasalukuyang lagay nito. Isa kada channel bawat ${minutes} minuto.`,
  belowThresholdTitle: "Mas mababa sa alert threshold mo",
  belowThresholdDescription: (healthFactor, threshold) =>
    `Ang kasalukuyang health factor mo (${healthFactor}) ay mas mababa sa threshold mo na ${threshold}.`,
  alertSaved: "Na-save ang alerto",
  saveFailed: "Hindi ma-save ang alerto mo",
  alertDeleted: "Na-delete ang alerto",
  deleteFailed: "Hindi ma-delete ang alerto mo",
  attributionQuestion: ATTRIBUTION_QUESTION,
  attributionFormLabel: `${ATTRIBUTION_QUESTION} (opsyonal)`,
  attributionDescription:
    "Nakakatulong ito para malaman namin kung aling mga channel ang gumagana. Nase-save kasama ng wallet address mo.",
  attributionEmpty: "Maglagay ng sagot, o piliin ang Laktawan.",
  // The checks behind it (length, hidden control characters) only fail for pasted text.
  attributionInvalid: () =>
    "Masyadong mahaba ang sagot o may mga nakatagong character ito. I-type ulit at subukan muli.",
  attributionSendFailed: "Hindi maipadala ang sagot mo. Subukan ulit o laktawan.",
  sendAnswer: "Ipadala ang sagot",
  sending: "Ipinapadala",
  skip: "Laktawan",
  answerSent: "Naipadala ang sagot",
};
