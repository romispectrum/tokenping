import type { AlertsMessages } from "./shared";
import { bgForMarket, bgOnMarket, plural } from "~~/i18n/format";

const ATTRIBUTION_QUESTION = "Откъде научихте за Tokenping?";

/** "на всеки 15 минути", "на всяка минута". */
const everyMinutes = (minutes: number) => (minutes === 1 ? "на всяка минута" : `на всеки ${minutes} минути`);

// The channel's name comes from serviceNames, where email is the badge "Имейл"; in a sentence it is "по имейл".
const via = (channel: string) => (channel === "Имейл" ? "по имейл" : `чрез ${channel}`);

export const MESSAGES: AlertsMessages = {
  cardTitle: "Настройки на известията",
  active: "Активно",
  payToEdit: "Платете достъп, за да редактирате",
  editAlert: "Редактиране на известието",
  signInTitle: "Влезте, за да управлявате известията си",
  signInDescription:
    "Портфейлът ви подписва съобщение, което доказва, че адресът е ваш. Това не е транзакция и не струва gas.",
  signIn: "Вход с портфейла",
  signingIn: "Изчакваме портфейла ви",
  signInStatement: "Влезте в Tokenping, за да виждате и редактирате известията си за health factor.",
  signInRejected: "Отказахте заявката за подпис. Влезте, за да виждате и редактирате известията си.",
  signInFailed: "Входът не успя. Опитайте отново.",
  signInExpired: "Сесията ви приключи. Влезте отново с портфейла си.",
  emptyTitle: (chainName, kind) => `Все още нямате известия ${bgOnMarket(chainName, kind)}`,
  emptyDescription: "Получавайте съобщение, когато вашият health factor падне под праг, който изберете.",
  createAlert: "Създаване на известие",
  loadErrorTitle: "Настройките на известията не се заредиха",
  loadErrorDescription: "Проверете връзката си и опитайте отново.",
  tryAgain: "Опитайте отново",
  retrying: "Опитваме отново",
  servicesLegend: "Канали за известия",
  servicesDescription: "Изберете къде да пристигат известията. Можете да изберете повече от един канал.",
  serviceNames: { email: "Имейл", signal: "Signal", telegram: "Telegram" },
  emailLabel: "Имейл адрес",
  emailDescription: "Известията се изпращат на този адрес.",
  emailPlaceholder: "name@example.com",
  signalLabel: "Потребителско име в Signal",
  signalDescription: "В Signal отворете Настройки, после Профил. Изглежда така: alice.42.",
  telegramLabel: "Потребителско име в Telegram",
  telegramDescription:
    "Известията отиват в този акаунт в Telegram. Ще го намерите в Telegram под Настройки, после Потребителско име.",
  telegramPlaceholder: "alice_eth",
  telegramChecking: "Проверяваме",
  telegramLinked: username => `Свързано: @${username}. Известията ще пристигат в чата ви в Telegram.`,
  telegramPressStart: bot =>
    `Все още не е свързано: натиснете веднъж Start в ${bot ? `@${bot}` : "бота на Tokenping"}.`,
  openBot: bot => `Отваряне на @${bot}`,
  telegramStatusUnknown: "Не успяхме да проверим дали това потребителско име е свързано. Все пак можете да запазите.",
  opensInNewTab: "(отваря се в нов раздел)",
  channelLanguageLabels: { email: "Език на имейлите", signal: "Език в Signal", telegram: "Език в Telegram" },
  thresholdLabel: "Праг на health factor",
  thresholdExactValue: "(точна стойност)",
  thresholdScale: { critical: "Критичен", safe: "Безопасен", verySafe: "Много безопасен" },
  thresholdDescription: (threshold, chainName, kind) =>
    `Ще получите известие, когато вашият health factor ${bgOnMarket(chainName, kind)} падне под ${threshold}.`,
  saveAlert: "Запазване на известието",
  saving: "Запазваме",
  cancel: "Отказ",
  deleteAlert: "Изтриване на известието",
  deleting: "Изтриваме",
  keepAlert: "Оставете известието",
  deleteTitle: "Да се изтрие ли това известие?",
  deleteDescription: (chainName, kind) =>
    `Tokenping ще спре да изпраща известия за health factor ${bgForMarket(chainName, kind)}.`,
  errorSummaryTitle: count =>
    plural("bg", count, {
      one: `Поправете ${count} поле, за да запазите`,
      other: `Поправете ${count} полета, за да запазите`,
    }),
  formErrors: {
    noService: "Изберете поне един канал за известия.",
    noEmail: "Въведете имейл адреса си.",
    invalidEmail: "Въведете имейл адрес във вида name@example.com.",
    noSignal: "Въведете потребителското си име в Signal.",
    invalidSignal:
      "Въведете потребителско име в Signal във вида alice.42. Ще го намерите в Signal под Настройки, после Профил.",
    noTelegram: "Въведете потребителското си име в Telegram.",
    invalidTelegram:
      "Въведете потребителско име в Telegram във вида alice_eth: от 4 до 32 букви, цифри или долни черти, започва с буква и не завършва с _.",
  },
  summaryServices: "Канали",
  summaryNoServices: "Няма избрани",
  summaryEmail: "Имейл",
  summarySignal: "Signal",
  summaryTelegram: "Telegram",
  summaryLanguage: "Език",
  summaryTelegramNotLinked: bot => `Все още не е свързано: натиснете веднъж Start в @${bot}.`,
  summaryThreshold: "Праг",
  sendTest: "Изпращане на тест",
  sendingTest: "Изпращаме",
  testAgainIn: minutes => `Отново след ${minutes} мин.`,
  testSent: channel => `Тестовото съобщение е изпратено ${via(channel)}. Проверете дали е пристигнало.`,
  testFailed: "Тестовото съобщение не беше изпратено",
  testLimitNote: minutes =>
    `Тестът изпраща това известие и позицията ви в сегашния им вид. По един тест на канал ${everyMinutes(minutes)}.`,
  belowThresholdTitle: "Под прага на известието ви",
  belowThresholdDescription: (healthFactor, threshold) =>
    `Текущият ви health factor (${healthFactor}) е под прага ви от ${threshold}.`,
  alertSaved: "Известието е запазено",
  saveFailed: "Известието не можа да бъде запазено",
  alertDeleted: "Известието е изтрито",
  deleteFailed: "Известието не можа да бъде изтрито",
  attributionQuestion: ATTRIBUTION_QUESTION,
  attributionFormLabel: `${ATTRIBUTION_QUESTION} (по избор)`,
  attributionDescription: "Помага ни да разберем кои канали работят. Запазва се заедно с адреса на портфейла ви.",
  attributionEmpty: "Въведете отговор или изберете Пропускане.",
  // The checks behind it (length, hidden control characters) only fail for pasted text.
  attributionInvalid: () => "Отговорът е твърде дълъг или съдържа скрити знаци. Напишете го отново и опитайте пак.",
  attributionSendFailed: "Отговорът ви не можа да бъде изпратен. Опитайте отново или пропуснете.",
  sendAnswer: "Изпращане на отговора",
  sending: "Изпращаме",
  skip: "Пропускане",
  answerSent: "Отговорът е изпратен",
};
