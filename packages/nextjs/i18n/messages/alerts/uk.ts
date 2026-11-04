import type { AlertsMessages } from "./shared";
import { formatDecimal, plural, ukForMarket, ukOnMarket } from "~~/i18n/format";

const ATTRIBUTION_QUESTION = "Як ви дізналися про Tokenping?";

/** "кожні 15 хвилин", "кожні 2 хвилини", "щохвилини". */
const everyMinutes = (minutes: number) =>
  minutes === 1
    ? "щохвилини"
    : plural("uk", minutes, {
        one: `кожні ${minutes} хвилину`,
        few: `кожні ${minutes} хвилини`,
        many: `кожні ${minutes} хвилин`,
        other: `кожні ${formatDecimal("uk", minutes)} хвилини`,
      });

// The channel's name comes from serviceNames, where email is the badge "Email"; in a sentence it is "через email".
const via = (channel: string) => `через ${channel === "Email" ? "email" : channel}`;

export const MESSAGES: AlertsMessages = {
  cardTitle: "Налаштування сповіщень",
  active: "Активне",
  payToEdit: "Оплатити доступ, щоб змінити",
  editAlert: "Змінити сповіщення",
  signInTitle: "Увійдіть, щоб керувати сповіщеннями",
  signInDescription:
    "Ваш гаманець підписує повідомлення, яке доводить, що адреса належить вам. Це не транзакція, і вона не витрачає gas.",
  signIn: "Увійти через гаманець",
  signingIn: "Очікування вашого гаманця",
  signInStatement: "Увійдіть у Tokenping, щоб переглядати і змінювати свої сповіщення про health factor.",
  signInRejected: "Ви відхилили запит на підпис. Увійдіть, щоб переглядати і змінювати свої сповіщення.",
  signInFailed: "Не вдалося увійти. Спробуйте ще раз.",
  signInExpired: "Ваш сеанс завершився. Увійдіть через гаманець ще раз.",
  emptyTitle: (chainName, kind) => `Поки немає сповіщень ${ukOnMarket(chainName, kind)}`,
  emptyDescription: "Отримуйте повідомлення, коли ваш health factor падає нижче обраного вами порогу.",
  createAlert: "Створити сповіщення",
  loadErrorTitle: "Налаштування сповіщень не завантажилися",
  loadErrorDescription: "Перевірте з'єднання і спробуйте ще раз.",
  tryAgain: "Спробувати ще раз",
  retrying: "Повторна спроба",
  servicesLegend: "Канали сповіщень",
  servicesDescription: "Виберіть, куди надходитимуть сповіщення. Можна вибрати кілька каналів.",
  serviceNames: { email: "Email", signal: "Signal", telegram: "Telegram" },
  emailLabel: "Адреса email",
  emailDescription: "Сповіщення надсилаються на цю адресу.",
  emailPlaceholder: "name@example.com",
  signalLabel: "Ім'я користувача в Signal",
  signalDescription: "У Signal відкрийте Налаштування, потім Профіль. Воно має такий вигляд: alice.42.",
  telegramLabel: "Ім'я користувача в Telegram",
  telegramDescription:
    "Сповіщення надходять на цей акаунт Telegram. Його можна знайти в Telegram у розділі Налаштування, потім Ім'я користувача.",
  telegramPlaceholder: "alice_eth",
  telegramChecking: "Перевірка",
  telegramLinked: username => `@${username} підключено: сповіщення надходитимуть у ваш чат у Telegram.`,
  telegramPressStart: bot =>
    `Ще не підключено: один раз натисніть Start ${bot ? `у боті @${bot}` : "у боті Tokenping"}.`,
  openBot: bot => `Відкрити @${bot}`,
  telegramStatusUnknown: "Не вдалося перевірити, чи підключено це ім'я користувача. Зберегти все одно можна.",
  opensInNewTab: "(відкривається в новій вкладці)",
  channelLanguageLabels: { email: "Мова email", signal: "Мова для Signal", telegram: "Мова для Telegram" },
  thresholdLabel: "Поріг health factor",
  thresholdExactValue: "(точне значення)",
  thresholdScale: { critical: "Критично", safe: "Безпечно", verySafe: "Дуже безпечно" },
  thresholdDescription: (threshold, chainName, kind) =>
    `Ви отримаєте сповіщення, коли ваш health factor ${ukOnMarket(chainName, kind)} впаде нижче ${threshold}.`,
  saveAlert: "Зберегти сповіщення",
  saving: "Збереження",
  cancel: "Скасувати",
  deleteAlert: "Видалити сповіщення",
  deleting: "Видалення",
  keepAlert: "Залишити сповіщення",
  deleteTitle: "Видалити це сповіщення?",
  deleteDescription: (chainName, kind) =>
    `Tokenping перестане надсилати сповіщення про health factor ${ukForMarket(chainName, kind)}.`,
  errorSummaryTitle: count =>
    plural("uk", count, {
      one: `Виправте ${count} поле, щоб зберегти`,
      few: `Виправте ${count} поля, щоб зберегти`,
      many: `Виправте ${count} полів, щоб зберегти`,
      other: `Виправте ${count} поля, щоб зберегти`,
    }),
  formErrors: {
    noService: "Виберіть принаймні один канал сповіщень.",
    noEmail: "Введіть свою адресу email.",
    invalidEmail: "Введіть адресу email на зразок name@example.com.",
    noSignal: "Введіть своє ім'я користувача в Signal.",
    invalidSignal:
      "Введіть ім'я користувача в Signal на зразок alice.42. Своє ви знайдете в Signal у розділі Налаштування, потім Профіль.",
    noTelegram: "Введіть своє ім'я користувача в Telegram.",
    invalidTelegram:
      "Введіть ім'я користувача в Telegram на зразок alice_eth: від 4 до 32 літер, цифр або підкреслень, починається з літери і не закінчується на _.",
  },
  summaryServices: "Канали",
  summaryNoServices: "Нічого не вибрано",
  summaryEmail: "Email",
  summarySignal: "Signal",
  summaryTelegram: "Telegram",
  summaryLanguage: "Мова",
  summaryTelegramNotLinked: bot => `Ще не підключено: один раз натисніть Start у боті @${bot}.`,
  summaryThreshold: "Поріг",
  sendTest: "Надіслати тест",
  sendingTest: "Надсилання",
  testAgainIn: minutes => `Знову через ${minutes} хв`,
  testSent: channel => `Тестове повідомлення надіслано ${via(channel)}. Перевірте, чи воно надійшло.`,
  testFailed: "Тестове повідомлення не надіслано",
  testLimitNote: minutes =>
    `Тест надсилає це сповіщення і вашу позицію в теперішньому стані. Один тест на канал ${everyMinutes(minutes)}.`,
  belowThresholdTitle: "Нижче порогу вашого сповіщення",
  belowThresholdDescription: (healthFactor, threshold) =>
    `Ваш поточний health factor (${healthFactor}) нижчий за ваш поріг ${threshold}.`,
  alertSaved: "Сповіщення збережено",
  saveFailed: "Не вдалося зберегти сповіщення",
  alertDeleted: "Сповіщення видалено",
  deleteFailed: "Не вдалося видалити сповіщення",
  attributionQuestion: ATTRIBUTION_QUESTION,
  attributionFormLabel: `${ATTRIBUTION_QUESTION} (необов'язково)`,
  attributionDescription: "Допомагає нам зрозуміти, які канали працюють. Зберігається разом з адресою вашого гаманця.",
  attributionEmpty: "Введіть відповідь або виберіть Пропустити.",
  attributionInvalid: () => "Відповідь задовга або містить приховані символи. Введіть її ще раз і спробуйте знову.",
  attributionSendFailed: "Не вдалося надіслати відповідь. Спробуйте ще раз або пропустіть.",
  sendAnswer: "Надіслати відповідь",
  sending: "Надсилання",
  skip: "Пропустити",
  answerSent: "Відповідь надіслано",
};
